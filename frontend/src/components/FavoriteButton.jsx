import { Heart } from "lucide-react";
import { useUser } from "@/context/userContext";

export default function FavoriteButton({
  song,
  size = 30,
  iconSize = 15,
  style = {},
  background = "rgba(255,255,255,0.06)",
  activeBackground = "rgba(244,63,94,0.16)",
  borderColor = "rgba(255,255,255,0.08)",
  activeBorderColor = "rgba(244,63,94,0.34)",
  inactiveColor = "#d1d5db",
  activeColor = "#fb7185",
}) {
  const { isFavorite, toggleFavorite } = useUser();
  const favorite = isFavorite(song?.id);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        toggleFavorite(song);
      }}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      title={favorite ? "Remove from favorites" : "Add to favorites"}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1px solid ${favorite ? activeBorderColor : borderColor}`,
        background: favorite ? activeBackground : background,
        color: favorite ? activeColor : inactiveColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      <Heart
        size={iconSize}
        strokeWidth={2}
        color={favorite ? activeColor : inactiveColor}
        fill={favorite ? activeColor : "transparent"}
      />
    </button>
  );
}
