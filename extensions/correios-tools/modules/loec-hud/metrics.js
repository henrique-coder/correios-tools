export function calculateMetrics(data) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const raw = {
    totalDistricts: data.length,
    totalObjects: 0,
    totalPoints: 0,
    totalExpired: 0,
    totalToday: 0,
    totalToExpire: 0,
    totalAR: 0,
  };

  data.forEach((district) => {
    raw.totalObjects += extractInt(district.qtde);
    raw.totalPoints += extractInt(district.qtdePontos);
    raw.totalExpired += extractInt(district.qtdeVencido);
    raw.totalToday += extractInt(district.qtdeHoje);
    raw.totalToExpire += extractInt(district.qtdeAVencer);
    raw.totalAR += extractInt(district.qtdeAR);
  });

  const computed = {
    deliveryDensity: raw.totalObjects > 0 ? (raw.totalObjects / raw.totalPoints).toFixed(2) : 0,
    chaosIndex: raw.totalObjects > 0 ? ((raw.totalExpired / raw.totalObjects) * 100).toFixed(1) : 0,
    operationalPressure:
      raw.totalObjects > 0
        ? (((raw.totalToday + raw.totalToExpire) / raw.totalObjects) * 100).toFixed(1)
        : 0,
    arFactor: raw.totalObjects > 0 ? ((raw.totalAR / raw.totalObjects) * 100).toFixed(1) : 0,
    avgObjectsPerDistrict:
      raw.totalDistricts > 0 ? (raw.totalObjects / raw.totalDistricts).toFixed(1) : 0,
  };

  return { raw, computed };
}

function extractInt(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = value.toString().replace(/<[^>]*>/g, "");
  return parseInt(cleaned, 10) || 0;
}

export function getStatusLevel(chaosIndex) {
  if (chaosIndex > 50) {
    return { color: "border-danger", text: "CRÍTICO", icon: "🔴" };
  }
  if (chaosIndex > 20) {
    return { color: "border-warning", text: "ATENÇÃO", icon: "🟡" };
  }
  return { color: "border-success", text: "CONTROLADO", icon: "🟢" };
}
