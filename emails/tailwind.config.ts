import { pixelBasedPreset, type TailwindConfig } from "react-email"

const tailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0f1117",
          amber: "#f59e0b",
          paper: "#f3f4f6",
        },
      },
    },
  },
} satisfies TailwindConfig

export default tailwindConfig
