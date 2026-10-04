// @ts-check
/**
 * Branch simulator — a tiny in-browser git that draws its commit graph.
 *
 * Supports: git commit [-m "msg"], git branch [-d|-D] [name], git switch [-c] name,
 * git checkout [-b] name, git merge [--no-ff] name, git log [--oneline],
 * git status, git push [-u] [origin name], help, clear.
 *
 * Usage:
 *   <div class="sim" id="sim1"></div>
 *   <script src="../assets/branch-sim.js"></script>
 *   <script>
 *     BranchSim.mount(document.getElementById("sim1"), {
 *       setup: ["git commit -m 'load data'"],        // run silently first
 *       tasks: [{ text: "Create a branch", check: (s) => Object.keys(s.branches).length > 1 }],
 *     });
 *   </script>
 */

/**
 * @typedef {{ id: string, parents: string[], msg: string, born: string, n: number }} Commit
 * @typedef {{
 *   head: string,
 *   branches: Record<string, string>,
 *   remotes: Record<string, string>,
 *   upstream: Record<string, string>,
 *   commits: Commit[],
 *   history: string[],
 *   tip: (name: string) => string | undefined,
 *   isAncestor: (a: string, b: string) => boolean,
 *   ahead: (branch: string, base: string) => number,
 *   mergeCommits: () => Commit[],
 * }} SimState
 * @typedef {{ text: string, check: (s: SimState) => boolean }} SimTask
 * @typedef {{ setup?: string[], tasks?: SimTask[], title?: string }} SimOptions
 */

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  /** @param {number} n */
  function fakeHash(n) {
    const h = (Math.imul(n + 7, 2654435761) >>> 0).toString(16).padStart(8, "0");
    return h.slice(0, 7);
  }

  /** @param {string} line @returns {string[]} */
  function tokenize(line) {
    const out = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(line)) !== null) out.push(m[1] ?? m[2] ?? m[3]);
    return out;
  }

  /** @returns {SimState} */
  function createState() {
    /** @type {SimState} */
    const s = {
      head: "main",
      branches: {},
      remotes: {},
      upstream: {},
      commits: [],
      history: [],
      tip(name) { return s.branches[name]; },
      isAncestor(a, b) {
        // true if commit a is reachable from commit b (or equal)
        const seen = new Set();
        const stack = [b];
        while (stack.length) {
          const id = /** @type {string} */ (stack.pop());
          if (id === a) return true;
          if (seen.has(id)) continue;
          seen.add(id);
          const c = byId(id);
          if (c) stack.push(...c.parents);
        }
        return false;
      },
      ahead(branch, base) {
        const t = s.branches[branch];
        const b = s.branches[base];
        if (!t || !b) return 0;
        return reachable(t).filter((id) => !reachable(b).includes(id)).length;
      },
      mergeCommits() { return s.commits.filter((c) => c.parents.length > 1); },
    };
    /** @param {string} id */
    function byId(id) { return s.commits.find((c) => c.id === id); }
    /** @param {string} from @returns {string[]} */
    function reachable(from) {
      const seen = new Set();
      const stack = [from];
      while (stack.length) {
        const id = /** @type {string} */ (stack.pop());
        if (seen.has(id)) continue;
        seen.add(id);
        const c = byId(id);
        if (c) stack.push(...c.parents);
      }
      return Array.from(seen);
    }
    return s;
  }

  /**
   * Run one command against the state. Returns output text and whether it errored.
   * @param {SimState} s @param {string} line
   * @returns {{ out: string, err?: boolean }}
   */
  function run(s, line) {
    const t = tokenize(line);
    if (t.length === 0) return { out: "" };
    if (t[0] === "help") {
      return { out: "Try: git commit -m \"msg\" · git branch NAME · git switch NAME · git switch -c NAME\n     git merge NAME · git branch -d NAME · git log --oneline · git status · git push -u origin NAME" };
    }
    if (t[0] !== "git") return { out: `${t[0]}: command not found in this simulator (try 'help')`, err: true };
    const sub = t[1];
    const args = t.slice(2);
    const flags = args.filter((a) => a.startsWith("-"));
    const names = args.filter((a, i) => !a.startsWith("-") && !(args[i - 1] === "-m"));
    const validName = (/** @type {string} */ n) => /^[A-Za-z0-9._\/-]+$/.test(n) && !n.startsWith("-");

    const newCommit = (/** @type {string} */ msg, /** @type {string[]} */ parents) => {
      const n = s.commits.length + 1;
      /** @type {Commit} */
      const c = { id: fakeHash(n), parents, msg, born: s.head, n };
      s.commits.push(c);
      s.branches[s.head] = c.id;
      return c;
    };

    const doSwitch = (/** @type {string} */ name, /** @type {boolean} */ create) => {
      if (!name) return { out: "fatal: missing branch name", err: true };
      if (create) {
        if (!validName(name)) return { out: `fatal: '${name}' is not a valid branch name`, err: true };
        if (s.branches[name]) return { out: `fatal: a branch named '${name}' already exists`, err: true };
        s.branches[name] = s.branches[s.head];
        s.head = name;
        return { out: `Switched to a new branch '${name}'` };
      }
      if (!s.branches[name]) {
        if (s.remotes[name]) {
          s.branches[name] = s.remotes[name];
          s.upstream[name] = name;
          s.head = name;
          return { out: `branch '${name}' set up to track 'origin/${name}'.\nSwitched to a new branch '${name}'` };
        }
        return { out: `fatal: invalid reference: ${name}`, err: true };
      }
      if (s.head === name) return { out: `Already on '${name}'` };
      s.head = name;
      return { out: `Switched to branch '${name}'` };
    };

    switch (sub) {
      case "commit": {
        const mi = args.indexOf("-m");
        const msg = mi >= 0 && args[mi + 1] ? args[mi + 1] : `work on ${s.head}`;
        const parent = s.branches[s.head];
        const c = newCommit(msg, parent ? [parent] : []);
        return { out: `[${s.head} ${c.id}] ${msg}` };
      }
      case "branch": {
        if (flags.includes("-d") || flags.includes("-D")) {
          const name = names[0];
          if (!name || !s.branches[name]) return { out: `error: branch '${name ?? ""}' not found`, err: true };
          if (name === s.head) return { out: `error: cannot delete branch '${name}' — it is checked out. Switch away first.`, err: true };
          const tip = s.branches[name];
          if (flags.includes("-d") && !s.isAncestor(tip, s.branches[s.head])) {
            return { out: `error: the branch '${name}' is not fully merged\nhint: If you are sure you want to delete it, run 'git branch -D ${name}'`, err: true };
          }
          delete s.branches[name];
          delete s.upstream[name];
          return { out: `Deleted branch ${name} (was ${tip}).` };
        }
        if (names.length === 0) {
          return { out: Object.keys(s.branches).sort().map((b) => (b === s.head ? "* " : "  ") + b).join("\n") };
        }
        const name = names[0];
        if (!validName(name)) return { out: `fatal: '${name}' is not a valid branch name`, err: true };
        if (s.branches[name]) return { out: `fatal: a branch named '${name}' already exists`, err: true };
        s.branches[name] = s.branches[s.head];
        return { out: "" };
      }
      case "switch":
        return doSwitch(names[0], flags.includes("-c") || flags.includes("--create"));
      case "checkout":
        return doSwitch(names[0], flags.includes("-b"));
      case "merge": {
        const name = names[0];
        const theirs = name?.startsWith("origin/") ? s.remotes[name.slice(7)] : s.branches[name ?? ""];
        if (!name || !theirs) return { out: `merge: ${name ?? ""} - not something we can merge`, err: true };
        const ours = s.branches[s.head];
        if (s.isAncestor(theirs, ours)) return { out: "Already up to date." };
        if (s.isAncestor(ours, theirs) && !flags.includes("--no-ff")) {
          s.branches[s.head] = theirs;
          return { out: `Updating ${ours}..${theirs}\nFast-forward` };
        }
        newCommit(`Merge branch '${name}' into ${s.head}`, [ours, theirs]);
        return { out: "Merge made by the 'ort' strategy." };
      }
      case "log": {
        const seen = new Set();
        const order = [];
        const stack = [s.branches[s.head]];
        while (stack.length) {
          const id = stack.pop();
          if (!id || seen.has(id)) continue;
          seen.add(id);
          const c = s.commits.find((x) => x.id === id);
          if (c) { order.push(c); stack.push(...c.parents); }
        }
        order.sort((a, b) => b.n - a.n);
        return {
          out: order.map((c) => {
            const refs = Object.keys(s.branches).filter((b) => s.branches[b] === c.id).map((b) => (b === s.head ? `HEAD -> ${b}` : b));
            Object.keys(s.remotes).filter((b) => s.remotes[b] === c.id).forEach((b) => refs.push(`origin/${b}`));
            return `${c.id} ${refs.length ? `(${refs.join(", ")}) ` : ""}${c.msg}`;
          }).join("\n"),
        };
      }
      case "status": {
        let extra = "";
        const up = s.upstream[s.head];
        if (up && s.remotes[up]) {
          const local = s.branches[s.head];
          const remote = s.remotes[up];
          if (local === remote) extra = `\nYour branch is up to date with 'origin/${up}'.`;
          else if (s.isAncestor(remote, local)) extra = `\nYour branch is ahead of 'origin/${up}'. (use "git push" to publish your local commits)`;
        }
        return { out: `On branch ${s.head}${extra}\nnothing to commit, working tree clean` };
      }
      case "push": {
        const setUp = flags.includes("-u") || flags.includes("--set-upstream");
        let target = names[1] ?? (names[0] && names[0] !== "origin" ? names[0] : undefined);
        if (!target) target = s.upstream[s.head];
        if (!target) {
          return { out: `fatal: The current branch ${s.head} has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream origin ${s.head}`, err: true };
        }
        if (!s.branches[target]) return { out: `error: src refspec ${target} does not match any`, err: true };
        const isNew = !s.remotes[target];
        s.remotes[target] = s.branches[target];
        let out = isNew ? ` * [new branch]      ${target} -> ${target}` : `   ${target} -> ${target}`;
        if (setUp) { s.upstream[target] = target; out += `\nbranch '${target}' set up to track 'origin/${target}'.`; }
        return { out };
      }
      default:
        return { out: `git ${sub ?? ""}: not supported in this simulator (try 'help')`, err: true };
    }
  }

  /** @param {string} tag @param {Record<string, string | number>} attrs */
  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    return el;
  }

  /** @param {SimState} s @returns {SVGSVGElement} */
  function render(s) {
    const laneOrder = ["main"];
    for (const c of s.commits) if (!laneOrder.includes(c.born)) laneOrder.push(c.born);
    const laneCls = (/** @type {number} */ i) => ["main", "feat", "feat2"][i] ?? "muted";

    /** @type {Record<string, string[]>} */
    const labels = {};
    for (const [b, id] of Object.entries(s.branches)) (labels[id] ??= []).push(b === s.head ? `HEAD → ${b}` : b);
    for (const [b, id] of Object.entries(s.remotes)) (labels[id] ??= []).push(`origin/${b}`);
    const maxLabels = Math.max(1, ...Object.values(labels).map((l) => l.length));

    const dx = 84, x0 = 36;
    const laneH = Math.max(62, 34 + 15 * maxLabels);
    const y0 = 22;
    const width = Math.max(320, x0 + s.commits.length * dx + 60);
    const height = y0 + laneOrder.length * laneH;
    const svg = /** @type {SVGSVGElement} */ (/** @type {unknown} */ (svgEl("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role: "img" })));
    svg.setAttribute("aria-label", `Commit graph with ${s.commits.length} commits; HEAD is on ${s.head}`);

    /** @type {Record<string, {x: number, y: number, lane: number}>} */
    const pos = {};
    s.commits.forEach((c, i) => {
      const lane = laneOrder.indexOf(c.born);
      pos[c.id] = { x: x0 + i * dx, y: y0 + lane * laneH, lane };
    });

    if (s.commits.length === 0) {
      const t = svgEl("text", { x: 16, y: 34, class: "label muted-fill" });
      t.textContent = "No commits yet — try: git commit -m \"first commit\"";
      svg.appendChild(t);
      return svg;
    }

    // edges
    for (const c of s.commits) {
      c.parents.forEach((pid, k) => {
        const a = pos[pid], b = pos[c.id];
        if (!a || !b) return;
        const cls = laneCls(k === 0 ? b.lane : a.lane) + "-line";
        const d = a.y === b.y
          ? `M${a.x} ${a.y} L${b.x} ${b.y}`
          : `M${a.x} ${a.y} C${a.x + dx * 0.6} ${a.y} ${b.x - dx * 0.6} ${b.y} ${b.x} ${b.y}`;
        svg.appendChild(svgEl("path", { d, class: cls, fill: "none", "stroke-width": 3 }));
      });
    }
    // nodes + labels
    const headTip = s.branches[s.head];
    for (const c of s.commits) {
      const p = pos[c.id];
      const node = svgEl("circle", { cx: p.x, cy: p.y, r: 9, class: laneCls(p.lane) + "-fill" });
      const title = svgEl("title", {});
      title.textContent = `${c.id} — ${c.msg}`;
      node.appendChild(title);
      svg.appendChild(node);
      if (c.id === headTip) svg.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 13, fill: "none", class: "ink-line", "stroke-width": 1.5 }));
      const hash = svgEl("text", { x: p.x, y: p.y - 15, "text-anchor": "middle", class: "muted-fill", "font-size": 10 });
      hash.textContent = c.id;
      svg.appendChild(hash);
      (labels[c.id] ?? []).forEach((lab, i) => {
        const isRemote = lab.startsWith("origin/");
        const t = svgEl("text", {
          x: p.x, y: p.y + 26 + i * 15, "text-anchor": "middle",
          class: isRemote ? "muted-fill" : "ink-fill",
          "font-weight": lab.startsWith("HEAD") ? 600 : 400,
          "font-style": isRemote ? "italic" : "normal",
        });
        t.textContent = lab;
        svg.appendChild(t);
      });
    }
    return svg;
  }

  /** @param {HTMLElement} el @param {SimOptions} [opts] */
  function mount(el, opts = {}) {
    const tasks = opts.tasks ?? [];
    let s = createState();
    /** @type {boolean[]} */
    let done = tasks.map(() => false);

    el.innerHTML = "";
    const graph = document.createElement("div");
    graph.className = "sim-graph";
    const term = document.createElement("div");
    term.className = "sim-term";
    const log = document.createElement("pre");
    log.className = "sim-log";
    log.setAttribute("aria-live", "polite");
    const form = document.createElement("form");
    const prompt = document.createElement("span");
    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("aria-label", "Simulator command");
    input.placeholder = "type a git command, e.g. git switch -c clean-data";
    form.append(prompt, input);
    term.append(log, form);

    const taskBox = document.createElement("div");
    taskBox.className = "sim-tasks";
    const bar = document.createElement("div");
    bar.className = "sim-bar";
    const h = document.createElement("h4");
    h.textContent = opts.title ?? (tasks.length ? "Your tasks" : "Sandbox");
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "secondary";
    reset.textContent = "Reset";
    bar.append(h, reset);
    const list = document.createElement("ol");
    const status = document.createElement("p");
    status.setAttribute("aria-live", "polite");
    taskBox.append(bar, list, status);

    el.append(graph, term, taskBox);

    /** History for up-arrow recall */
    /** @type {string[]} */
    let recall = [];
    let recallIdx = 0;

    function paint() {
      graph.innerHTML = "";
      graph.appendChild(render(s));
      prompt.textContent = `(${s.head}) $`;
      list.innerHTML = "";
      tasks.forEach((task, i) => {
        if (!done[i]) {
          try { done[i] = task.check(s); } catch { done[i] = false; }
        }
        const li = document.createElement("li");
        li.innerHTML = task.text;
        if (done[i]) li.className = "done";
        list.appendChild(li);
      });
      status.textContent = tasks.length && done.every(Boolean) ? "All tasks complete. Nicely done." : "";
    }

    /** @param {string} text @param {string} [cls] */
    function print(text, cls) {
      if (!text) return;
      const span = document.createElement("span");
      if (cls) span.className = cls;
      span.textContent = text + "\n";
      log.appendChild(span);
      log.scrollTop = log.scrollHeight;
    }

    function init() {
      s = createState();
      done = tasks.map(() => false);
      log.innerHTML = "";
      for (const cmd of opts.setup ?? []) run(s, cmd);
      print("Simulator ready. Type 'help' for the supported commands.", "");
      paint();
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const line = input.value.trim();
      input.value = "";
      if (!line) return;
      recall.push(line);
      recallIdx = recall.length;
      if (line === "clear") { log.innerHTML = ""; return; }
      print(`(${s.head}) $ ${line}`, "cmd");
      const r = run(s, line);
      s.history.push(line);
      print(r.out, r.err ? "err" : "");
      paint();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && recallIdx > 0) { recallIdx--; input.value = recall[recallIdx]; e.preventDefault(); }
      if (e.key === "ArrowDown") { recallIdx = Math.min(recall.length, recallIdx + 1); input.value = recall[recallIdx] ?? ""; e.preventDefault(); }
    });
    reset.addEventListener("click", init);
    init();
  }

  /** @type {any} */ (window).BranchSim = { mount, run, createState };
})();
