import { pixelBasedPreset, type TailwindConfig } from "react-email"

const tailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0c0d10",
          gold: "#e0b429",
          cream: "#fbf7ef",
          mist: "#f3eee4",
          line: "#e4dccb",
          mute: "#6b6558",
          paper: "#1a1c22",
        },
      },
    },
  },
} satisfies TailwindConfig

export default tailwindConfig
