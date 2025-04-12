export default function LikeDisplay({ count }) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <span style={{
          padding: "8px 16px",
          borderRadius: "20px",
          backgroundColor: "#e6f7ff",
          fontSize: "16px"
        }}>
          👍 いいね: {count}
        </span>
      </div>
    );
  }