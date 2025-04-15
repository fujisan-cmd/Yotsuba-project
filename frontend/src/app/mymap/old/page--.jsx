"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import neo4j_fetch from "./neo4j_fetch";
import styles from "./MyPage.module.css";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

export default function Page() {
  const [graphic, setgraphic] = useState(null);
  const [loading, setLoading] = useState(true);
  const graphRef = useRef();
  const router = useRouter();

  const fixedWidth = 1000;
  const fixedHeight = 600;

  // グラフ取得
  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await neo4j_fetch(token);
        const parsed = typeof res === "string" ? JSON.parse(res) : res;
        setgraphic(parsed);
      } catch (err) {
        console.error("グラフ取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // ズームフィット
  useEffect(() => {
    if (graphic && graphRef.current) {
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 60);
      }, 300);
    }
  }, [graphic]);

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#096dd9", marginBottom: "20px" }}>
          関連度グラフテストページ
        </h2>

        {loading ? (
          <p style={{ color: "#555", fontWeight: "bold" }}>Loading graph data...</p>
        ) : graphic ? (
          <div
            style={{
              width: `${fixedWidth}px`,
              height: `${fixedHeight}px`,
              margin: "0 auto",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <ForceGraph2D
              ref={graphRef}
              graphData={graphic}
              width={fixedWidth}
              height={fixedHeight}
              linkWidth={(link) => link.similarity * 2}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.name;
                const fontSize = 20 / globalScale;
                const radius = 10;
              
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = "#d0f0c0";
                ctx.fill();
                ctx.lineWidth = 0.5; 
                ctx.strokeStyle = "darkblue";
                ctx.stroke();
              
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
              
                ctx.lineWidth = 1;
                ctx.strokeStyle = "white";
                ctx.strokeText(label, node.x, node.y);
              
                ctx.fillStyle = "black";
                ctx.fillText(label, node.x, node.y);
              }}
              
              nodePointerAreaPaint={(node, color, ctx) => {
                const radius = 8;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fill();
              }}
              linkCanvasObjectMode={() => "replace"}
              linkCanvasObject={(link, ctx) => {
                const { source, target, relation_type, similarity } = link;
                const sx = source.x, sy = source.y;
                const tx = target.x, ty = target.y;
                const mx = (sx + tx) / 2;
                const my = (sy + ty) / 2;
                const dx = tx - sx;
                const dy = ty - sy;
                let nx = -dy;
                let ny = dx;
                const nLength = Math.sqrt(nx * nx + ny * ny) || 1;
                nx /= nLength;
                ny /= nLength;

                let multiplier = 0;
                switch (relation_type) {
                  case "skill": multiplier = -1.5; break;
                  case "experience": multiplier = -0.5; break;
                  case "hobby": multiplier = 0.5; break;
                  case "intro": multiplier = 1.5; break;
                  default: multiplier = 0;
                }

                const curveOffset = 5 * multiplier;
                const cx = mx + nx * curveOffset;
                const cy = my + ny * curveOffset;

                let color = "white";
                switch (relation_type) {
                  case "skill": color = "#4a90e2"; break;
                  case "experience": color = "#f5a623"; break;
                  case "hobby": color = "#7ed321"; break;
                  case "intro": color = "#d0021b"; break;
                  default: color = "white";
                }

                ctx.strokeStyle = color;
                ctx.lineWidth = similarity * 1;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.quadraticCurveTo(cx, cy, tx, ty);
                ctx.stroke();
              }}
            />
          </div>
        ) : (
          <p style={{ color: "red" }}>グラフデータの取得に失敗しました。</p>
        )}
      </div>
    </div>
  );
}
