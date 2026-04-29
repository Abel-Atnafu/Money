import { useState, useRef, useEffect, useCallback } from "react";

// ─── Utility ──────────────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  "Judging you...",
  "Wincing at your formatting...",
  "Questioning your life choices...",
  "Counting your buzzwords...",
  "Measuring the damage...",
  "Consulting the roast oracle...",
  "Preparing the burns...",
  "Crying on your behalf..."
];

const GRADE_MAP = [
  [90, "A+"],
  [85, "A"],
  [80, "A−"],
  [75, "B+"],
  [70, "B"],
  [65, "B−"],
  [60, "C+"],
  [55, "C"],
  [50, "C−"],
  [45, "D+"],
  [40, "D"],
  [35, "D−"],
  [0, "F"]
];

function getGrade(score) {
  for (const [min, grade] of GRADE_MAP) {
    if (score >= min) return grade;
  }
  return "F";
}

function getGradeColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#eab308";
  if (score >= 50) return "#f97316";
  return "#ef4444";
}

async function callApi(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

async function getRoast(resumeText) {
  return callApi("/api/roast", { resumeText });
}

async function getRewrite(resumeText) {
  const data = await callApi("/api/rewrite", { resumeText });
  return data.rewriteText ?? "";
}

// ─── Components ───────────────────────────────────────────────────────────────
function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count.toLocaleString()}</span>;
}

function ScoreRing({ score, size = 120 }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(circ);
  const color = getGradeColor(score);

  useEffect(() => {
    const t = setTimeout(() => setDash(circ * (1 - score / 100)), 100);
    return () => clearTimeout(t);
  }, [score, circ]);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="8"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

function ScoreBar({ label, value }) {
  const [width, setWidth] = useState(0);
  const color = getGradeColor(value * 10);

  useEffect(() => {
    const t = setTimeout(() => setWidth(value * 10), 200);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#aaa", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          {label}
        </span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{value}/10</span>
      </div>
      <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: color,
            borderRadius: 3,
            transition: "width 1s cubic-bezier(.4,0,.2,1)"
          }}
        />
      </div>
    </div>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────
function LandingScreen({ onStart }) {
  const [dragOver, setDragOver] = useState(false);
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // NOTE: This is a demo placeholder. Real PDF extraction must happen server-side.
      const fakeExtracted = `[Extracted from: ${file.name}]

Software Engineer with 5 years experience. Responsible for many tasks. Good at coding. Worked on projects. Team player. Detail-oriented. Results-driven professional.

Experience:
- Software Engineer at Tech Company (2020-present)
 • Did stuff with code
 • Collaborated with team members
 • Utilized Agile methodologies

Skills: JavaScript, Python, Communication, Teamwork, Microsoft Office

Education: BS Computer Science, State University 2019`;

      onStart(fakeExtracted, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const sampleRoasts = [
    {
      score: 23,
      grade: "F",
      name: "Chad M.",
      roast:
        '"Responsible for many tasks" is doing heavy lifting for a resume that couldn\'t bench press a thought.'
    },
    {
      score: 41,
      grade: "D",
      name: "Priya K.",
      roast: "Your skills section is 40% soft skills and 0% evidence you have them."
    },
    { score: 67, grade: "C+", name: "James T.", roast: "You listed Excel as a skill in 2024. Bold strategy." }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #FF4500; color: #fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #FF4500; border-radius: 3px; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(255,69,0,.3)} 50%{box-shadow:0 0 40px rgba(255,69,0,.6)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>

      <nav
        style={{
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #1a1a1a"
        }}
      >
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#FF4500", letterSpacing: 2 }}>
          🔥 RoastMyResume.ai
        </div>
        <div style={{ fontSize: 13, color: "#666" }}>
          <span style={{ color: "#FF4500", fontWeight: 700 }}>
            <AnimatedCounter target={12847} />
          </span>{" "}
          resumes roasted
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 40px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            background: "#1a1a1a",
            border: "1px solid #FF4500",
            borderRadius: 100,
            padding: "6px 16px",
            fontSize: 12,
            color: "#FF4500",
            fontWeight: 600,
            letterSpacing: 2,
            marginBottom: 24,
            textTransform: "uppercase"
          }}
        >
          Free • No Sign Up • Instant Results
        </div>

        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(56px, 10vw, 108px)",
            lineHeight: 0.92,
            letterSpacing: 2,
            marginBottom: 24
          }}
        >
          Your Resume
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #FF4500, #FF6B35, #FF4500)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s linear infinite"
            }}
          >
            Sucks.
          </span>
          <br />
          We'll Tell You Why.
        </h1>

        <p style={{ fontSize: 20, color: "#999", maxWidth: 540, margin: "0 auto 48px", lineHeight: 1.6 }}>
          Get a brutally honest AI roast in 30 seconds. Free. Then let us fix it for $9.
        </p>

        <div
          style={{
            background: "#111",
            border: `2px ${dragOver ? "solid" : "dashed"} ${dragOver ? "#FF4500" : "#333"}`,
            borderRadius: 20,
            padding: "48px 32px",
            maxWidth: 600,
            margin: "0 auto 16px",
            transition: "all .2s",
            animation: dragOver ? "pulse-glow 1s infinite" : "none"
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 32, background: "#1a1a1a", borderRadius: 10, padding: 4 }}>
            {["upload", "paste"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === tab ? "#FF4500" : "transparent",
                  color: activeTab === tab ? "#fff" : "#666",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all .2s",
                  textTransform: "capitalize"
                }}
              >
                {tab === "upload" ? "📎 Upload PDF" : "📋 Paste Text"}
              </button>
            ))}
          </div>

          {activeTab === "upload" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>📄</div>
              <p style={{ color: "#666", marginBottom: 20, fontSize: 15 }}>Drag & drop your PDF here, or</p>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  background: "#FF4500",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 32px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  transition: "all .2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e63e00")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FF4500")}
              >
                Choose File
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <p style={{ color: "#444", fontSize: 12, marginTop: 12 }}>PDF or TXT • Max 5MB</p>
            </div>
          ) : (
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your resume text here... All 847 words of mediocrity."
                style={{
                  width: "100%",
                  minHeight: 200,
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: 10,
                  padding: 16,
                  color: "#ccc",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  resize: "vertical",
                  outline: "none",
                  lineHeight: 1.6
                }}
              />
              <button
                onClick={() => text.trim() && onStart(text, "Pasted Resume")}
                disabled={!text.trim()}
                style={{
                  width: "100%",
                  marginTop: 12,
                  background: text.trim() ? "#FF4500" : "#2a2a2a",
                  color: text.trim() ? "#fff" : "#555",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: text.trim() ? "pointer" : "not-allowed",
                  transition: "all .2s"
                }}
              >
                Roast My Resume 🔥
              </button>
            </div>
          )}
        </div>

        <p style={{ color: "#444", fontSize: 12 }}>No account needed. We don't store your data.</p>
      </div>

      <div style={{ maxWidth: 1000, margin: "60px auto", padding: "0 24px" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, textAlign: "center", marginBottom: 8, letterSpacing: 2 }}>
          Recent Victims
        </h2>
        <p style={{ color: "#555", textAlign: "center", marginBottom: 40, fontSize: 14 }}>Real roasts. Real pain. Real growth.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {sampleRoasts.map((r, i) => (
            <div
              key={i}
              style={{
                background: "linear-gradient(135deg, #111 0%, #1a1a1a 100%)",
                border: "1px solid #222",
                borderRadius: 16,
                padding: 24,
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: "radial-gradient(circle, rgba(255,69,0,.15) 0%, transparent 70%)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#1a1a1a",
                    border: `2px solid ${getGradeColor(r.score)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 20,
                    color: getGradeColor(r.score)
                  }}
                >
                  {r.grade}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                  <div style={{ color: "#555", fontSize: 12 }}>Score: {r.score}/100</div>
                </div>
              </div>
              <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.6, fontStyle: "italic" }}>"{r.roast}"</p>
              <div style={{ marginTop: 16, fontSize: 11, color: "#444" }}>🔥 RoastMyResume.ai</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, marginBottom: 48, letterSpacing: 2 }}>How It Works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
          {[
            { step: "01", icon: "📎", title: "Upload Your Resume", desc: "PDF or paste text. Takes 5 seconds." },
            { step: "02", icon: "🤖", title: "AI Judges You", desc: "Claude reads every cringeworthy word." },
            { step: "03", icon: "🔥", title: "Get Roasted", desc: "Brutal honesty. Actionable feedback." },
            { step: "04", icon: "✨", title: "Get Rewritten ($9)", desc: "Optional full rewrite by AI. Worth it." }
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, color: "#1a1a1a", marginBottom: -8 }}>{s.step}</div>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
              <div style={{ color: "#555", fontSize: 14, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "24px 40px", textAlign: "center", color: "#333", fontSize: 12 }}>
        © 2026 RoastMyResume.ai — We roast with love. Mostly. · Built with 🔥 and Claude
      </footer>
    </div>
  );
}

function LoadingScreen({ filename }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1800);
    const t2 = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D0D0D",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes flame-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes msg-fade { 0%{opacity:0;transform:translateY(10px)} 20%,80%{opacity:1;transform:none} 100%{opacity:0;transform:translateY(-10px)} }
      `}</style>

      <div style={{ fontSize: 96, animation: "flame-pulse 1.2s ease-in-out infinite", marginBottom: 32 }}>🔥</div>

      <div style={{ width: 80, height: 80, marginBottom: 32, position: "relative" }}>
        <svg width="80" height="80" style={{ animation: "spin-slow 1.5s linear infinite" }}>
          <circle cx="40" cy="40" r="32" fill="none" stroke="#1a1a1a" strokeWidth="4" />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="#FF4500"
            strokeWidth="4"
            strokeDasharray="60 140"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 4, color: "#FF4500", marginBottom: 24 }}>
        ANALYZING{".".repeat(dots + 1)}
      </div>

      <div
        key={msgIdx}
        style={{ color: "#666", fontSize: 16, animation: "msg-fade 1.8s ease forwards", textAlign: "center" }}
      >
        {LOADING_MESSAGES[msgIdx]}
      </div>

      {filename && (
        <div style={{ marginTop: 48, background: "#111", borderRadius: 10, padding: "10px 20px", color: "#444", fontSize: 13 }}>
          📄 {filename}
        </div>
      )}
    </div>
  );
}

function RoastCard({ roastData, filename, onGetRewrite, rewriteDone, rewriteText, rewriteLoading }) {
  const [copied, setCopied] = useState(false);
  const grade = getGrade(roastData.overall_score);
  const gradeColor = getGradeColor(roastData.overall_score);

  const handleCopy = () => {
    navigator.clipboard.writeText(rewriteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tweetText = encodeURIComponent(
    `My resume just got roasted 🔥 Score: ${roastData.overall_score}/100 (${grade})\n"${roastData.top_roast}"\n\nGet yours: RoastMyResume.ai`
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        @keyframes scale-in { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }
        .roast-line { animation: slide-up .4s ease forwards; opacity:0; }
        .card-animate { animation: scale-in .5s cubic-bezier(.34,1.56,.64,1) forwards; }
      `}</style>

      <nav style={{ padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#FF4500", letterSpacing: 2 }}>🔥 RoastMyResume.ai</div>
        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}`}
          target="_blank"
          rel="noreferrer"
          style={{
            background: "#1da1f2",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          𝕏 Share Your Roast
        </a>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <div
          className="card-animate"
          style={{
            background: "linear-gradient(135deg, #111 0%, #1a1a1a 50%, #111 100%)",
            border: "1px solid #222",
            borderRadius: 24,
            padding: "48px 40px",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
            textAlign: "center"
          }}
        >
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: `radial-gradient(circle, ${gradeColor}22 0%, transparent 70%)` }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, background: "radial-gradient(circle, rgba(255,69,0,.1) 0%, transparent 70%)" }} />

          <div style={{ fontSize: 13, color: "#555", letterSpacing: 3, textTransform: "uppercase", marginBottom: 24 }}>
            Resume Assessment · {filename}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <ScoreRing score={roastData.overall_score} size={140} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: gradeColor, lineHeight: 1 }}>{roastData.overall_score}</div>
                <div style={{ color: "#555", fontSize: 12 }}>/100</div>
              </div>
            </div>

            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 100, color: gradeColor, lineHeight: 0.85 }}>{grade}</div>
              <div style={{ color: "#555", fontSize: 14, marginTop: 8 }}>
                {roastData.overall_score >= 80
                  ? "Not bad, overachiever."
                  : roastData.overall_score >= 60
                    ? "Room for improvement."
                    : roastData.overall_score >= 40
                      ? "Bless your heart."
                      : "Sir, this is a Wendy's."}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, background: "#1a2a1a", border: "1px solid #2a4a2a", borderRadius: 10, padding: "12px 20px", display: "inline-block" }}>
            <span style={{ color: "#22c55e", fontSize: 13 }}>✓ One thing you did right: </span>
            <span style={{ color: "#aaa", fontSize: 13 }}>{roastData.one_good_thing}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 20, padding: 32 }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, marginBottom: 24, color: "#FF4500" }}>🔥 The Roast</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {roastData.roast_lines.map((line, i) => (
                <div
                  key={i}
                  className="roast-line"
                  style={{
                    display: "flex",
                    gap: 12,
                    animationDelay: `${i * 0.1}s`,
                    paddingBottom: 16,
                    borderBottom: i < roastData.roast_lines.length - 1 ? "1px solid #1a1a1a" : "none"
                  }}
                >
                  <span style={{ color: "#FF4500", fontSize: 18, flexShrink: 0, marginTop: 1 }}>🔥</span>
                  <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{line}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 20, padding: 32 }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, marginBottom: 24 }}>📊 Breakdown</h2>
            <ScoreBar label="Impact & Achievements" value={roastData.scores.impact} />
            <ScoreBar label="Formatting" value={roastData.scores.formatting} />
            <ScoreBar label="Keywords / ATS" value={roastData.scores.keywords} />
            <ScoreBar label="Clarity" value={roastData.scores.clarity} />
            <ScoreBar label="Experience" value={roastData.scores.experience} />

            <div style={{ marginTop: 32, background: "linear-gradient(135deg, #1a1a1a, #0f0f0f)", border: "1px solid #333", borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 3, color: "#FF4500", marginBottom: 8 }}>🔥 ROASTMYRESUME.AI</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: gradeColor, lineHeight: 1 }}>{grade}</span>
                <span style={{ color: "#555", fontSize: 24 }}>{roastData.overall_score}/100</span>
              </div>
              <p style={{ color: "#888", fontSize: 12, fontStyle: "italic", lineHeight: 1.5 }}>"{roastData.top_roast}"</p>
            </div>
          </div>
        </div>

        {!rewriteDone ? (
          <div style={{ background: "linear-gradient(135deg, #1a0f00 0%, #2a1500 100%)", border: "1px solid #FF4500", borderRadius: 20, padding: "40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, rgba(255,69,0,.15) 0%, transparent 60%)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 2, marginBottom: 8 }}>Want Us To FIX It?</h2>
              <p style={{ color: "#999", margin: "0 auto 32px", fontSize: 16, maxWidth: 500 }}>
                Our AI will rewrite your entire resume from scratch — achievement-focused, ATS-optimized, ready to send.
              </p>
              <button
                onClick={onGetRewrite}
                disabled={rewriteLoading}
                style={{
                  background: rewriteLoading ? "#333" : "#FF4500",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "18px 48px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 20,
                  cursor: rewriteLoading ? "not-allowed" : "pointer",
                  transition: "all .2s"
                }}
              >
                {rewriteLoading ? "✍️ Rewriting..." : "Get Full Rewrite for $9 →"}
              </button>
              <p style={{ color: "#444", fontSize: 12, marginTop: 12 }}>{rewriteLoading ? "Claude is rewriting your resume..." : "One-time payment · Instant delivery · 100% original"}</p>
            </div>
          </div>
        ) : (
          <div style={{ background: "#111", border: "1px solid #22c55e", borderRadius: 20, padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: 32 }}>✨</span>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, color: "#22c55e" }}>Your Rewritten Resume</h2>
            </div>
            <pre
              style={{
                background: "#0a0a0a",
                border: "1px solid #1a1a1a",
                borderRadius: 12,
                padding: 24,
                color: "#ccc",
                fontSize: 13,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                maxHeight: 400,
                overflowY: "auto",
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              {rewriteText}
            </pre>
            <button
              onClick={handleCopy}
              style={{
                marginTop: 16,
                background: copied ? "#22c55e" : "#1a1a1a",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: 8,
                padding: "10px 24px",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                transition: "all .2s"
              }}
            >
              {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | loading | roast
  const [resumeText, setResumeText] = useState("");
  const [filename, setFilename] = useState("");
  const [roastData, setRoastData] = useState(null);
  const [error, setError] = useState(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteText, setRewriteText] = useState("");
  const [rewriteDone, setRewriteDone] = useState(false);

  const handleStart = useCallback(async (text, fname) => {
    setResumeText(text);
    setFilename(fname);
    setScreen("loading");
    setError(null);
    setRewriteDone(false);
    setRewriteText("");

    try {
      const data = await getRoast(text);
      setRoastData(data);
      setScreen("roast");
    } catch (e) {
      setError("Failed to generate roast. Check your API key / server, then try again.");
      setScreen("landing");
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }, []);

  const handleRewrite = useCallback(async () => {
    setRewriteLoading(true);
    try {
      const rewritten = await getRewrite(resumeText);
      setRewriteText(rewritten);
      setRewriteDone(true);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setRewriteLoading(false);
    }
  }, [resumeText]);

  if (screen === "loading") return <LoadingScreen filename={filename} />;
  if (screen === "roast" && roastData)
    return (
      <RoastCard
        roastData={roastData}
        filename={filename}
        onGetRewrite={handleRewrite}
        rewriteDone={rewriteDone}
        rewriteText={rewriteText}
        rewriteLoading={rewriteLoading}
      />
    );

  return (
    <div>
      {error && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#ef4444",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 10,
            zIndex: 999,
            fontFamily: "sans-serif",
            fontSize: 14
          }}
        >
          ⚠️ {error}
        </div>
      )}
      <LandingScreen onStart={handleStart} />
    </div>
  );
}

