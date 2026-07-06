import { Text, View } from "react-native";
import Svg, { G, Rect } from "react-native-svg";
import { useTheme } from "@/lib/ThemeContext";
import type { CashFlowMonth } from "@worthlane/types";

interface CashFlowBarsProps {
  data: CashFlowMonth[];
  width: number;
  height: number;
}

function monthLabel(month: string): string {
  const [, m] = month.split("-");
  return ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m)] ?? month;
}

/** Paired income/spending bars per month — same visual language as NetWorthChart. */
export function CashFlowBars({ data, width, height }: CashFlowBarsProps) {
  const { colors, typography } = useTheme();

  if (data.length === 0) {
    return (
      <View style={{ height, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ ...typography.caption, textAlign: "center" }}>
          Add transactions to see your cash flow
        </Text>
      </View>
    );
  }

  const padTop = 8;
  const padBottom = 18;
  const chartH = height - padTop - padBottom;
  const groupWidth = width / data.length;
  const barWidth = Math.min(14, groupWidth * 0.28);
  const gap = 3;

  const maxVal = Math.max(1, ...data.flatMap((d) => [d.income, d.spending]));
  const scale = (v: number) => (v / maxVal) * chartH;

  return (
    <View>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const centerX = i * groupWidth + groupWidth / 2;
          const incomeH = Math.max(d.income > 0 ? 2 : 0, scale(d.income));
          const spendH = Math.max(d.spending > 0 ? 2 : 0, scale(d.spending));
          return (
            <G key={d.month}>
              <Rect
                x={centerX - barWidth - gap / 2}
                y={padTop + chartH - incomeH}
                width={barWidth}
                height={incomeH}
                rx={3}
                fill={colors.primary}
                opacity={0.9}
              />
              <Rect
                x={centerX + gap / 2}
                y={padTop + chartH - spendH}
                width={barWidth}
                height={spendH}
                rx={3}
                fill={colors.danger}
                opacity={0.75}
              />
            </G>
          );
        })}
      </Svg>
      <View style={{ flexDirection: "row" }}>
        {data.map((d) => (
          <Text
            key={d.month}
            style={{ fontSize: 9, color: colors.textDim, width: groupWidth, textAlign: "center" }}
          >
            {monthLabel(d.month)}
          </Text>
        ))}
      </View>
    </View>
  );
}
