"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import fetchtest from "./fetchtest";
import neo4j_fetch from "./neo4j_fetch";

// SSRを無効にしてForceGraph2Dを読み込む
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
  });

export default function Page(){
    const [APIresult, setAPIresult] = useState(["Ping..."]);
    const [graphic, setgraphic] = useState(null);
    const router = useRouter();
    const APItest = async () => {
        const pong = await fetchtest();
        setAPIresult(pong.message);
    };
    const Neo4Jtest = async () => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }
        const res = await neo4j_fetch(token);
        const parsed = typeof res === "string" ? JSON.parse(res) : res;
        setgraphic(parsed);
    };

    return(
        <>
        <p>これはテストページだよ。</p>
        <button onClick={APItest} className="btn btn-neutral w-full border-0 bg-blue-200 text-black hover:text-white">
            Ping
        </button>
        <p>{APIresult}</p>

        <button onClick={Neo4Jtest} className="btn btn-neutral w-full border-0 bg-blue-200 text-black hover:text-white">
            Get Graph Data
        </button>
        
        {graphic && (
            <div>
            <ForceGraph2D
                graphData={graphic}
                linkWidth={link => link.similarity * 20} // similarityに応じて太さ変更（例：2倍スケーリング）
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    const radius = 5;
                
                    // ノード（円）の描画
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = 'lightblue';
                    ctx.fill();
                    ctx.strokeStyle = 'darkblue';
                    ctx.stroke();
                
                    // ラベル（円の下側に表示）
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = 'black';
                    ctx.fillText(label, node.x, node.y + radius + 2);
                  }}
                  nodePointerAreaPaint={(node, color, ctx) => {
                    const radius = 8;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                    ctx.fill();
                  }}
                
                  // リンク（エッジ）のカスタム描画
                  linkCanvasObjectMode={() => 'replace'}
                  linkCanvasObject={(link, ctx) => {
                    const { source, target, relation_type, similarity } = link;
                
                    // source と target の座標を取得
                    const sx = source.x, sy = source.y;
                    const tx = target.x, ty = target.y;
                
                    // 直線の中点（基本となる位置）
                    const mx = (sx + tx) / 2;
                    const my = (sy + ty) / 2;
                
                    // source → target のベクトルから、垂直な方向のベクトル（ノーマル）を算出
                    const dx = tx - sx;
                    const dy = ty - sy;
                    let nx = -dy;
                    let ny = dx;
                    const nLength = Math.sqrt(nx * nx + ny * ny) || 1;
                    nx /= nLength;
                    ny /= nLength;
                
                    // relation_type ごとに異なる「倍率」を設定して、曲率（オフセット）を分ける
                    // ※例：'parent', 'child', 'sibling', 'other' の4種類を想定
                    let multiplier = 0;
                    switch (relation_type) {
                      case 'skill':
                        multiplier = -1.5; // 例：左寄り（負）
                        break;
                      case 'experience':
                        multiplier = -0.5;
                        break;
                      case 'hobby':
                        multiplier = 0.5;
                        break;
                      case 'intro':
                        multiplier = 1.5;  // 例：右寄り（正）
                        break;
                      default:
                        multiplier = 0; // 該当しなければ直線描画
                    }
                
                    // 基本となるオフセット値（この値は調整可能です）
                    const curveOffset = 5 * multiplier;
                    // 制御点は中点から、計算したノーマル方向に curveOffset だけずらす
                    const cx = mx + nx * curveOffset;
                    const cy = my + ny * curveOffset;
                
                    // relation_type に応じてリンクの色を変更（例）
                    let color = 'white';
                    switch (relation_type) {
                      case 'skill':
                        color = 'blue';
                        break;
                      case 'experience':
                        color = 'orange';
                        break;
                      case 'hobby':
                        color = 'yellow';
                        break;
                      case 'intro':
                        color = 'pink';
                        break;
                      default:
                        color = 'white';
                    }
                    ctx.strokeStyle = color;
                    ctx.lineWidth = similarity * 2;
                
                    // quadraticCurve を使用してカーブを描画
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.quadraticCurveTo(cx, cy, tx, ty);
                    ctx.stroke();
                }}
            />
            </div>
        )}
        </>
    );
}