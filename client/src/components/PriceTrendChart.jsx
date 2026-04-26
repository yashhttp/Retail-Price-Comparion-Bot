import ReactApexChart from "react-apexcharts";

const PriceTrendChart = ({ history, product, analytics }) => {
  if (!product) {
    return (
      <div className="card">
        <div className="card-title">Price Trend</div>
        <p className="muted">Select a product to view price history.</p>
      </div>
    );
  }

  const series = [
    {
      name: product.name,
      data: history.map((entry) => [new Date(entry.recordedAt).getTime(), entry.price])
    }
  ];

  const options = {
    chart: {
      type: "area",
      stacked: false,
      height: 350,
      zoom: {
        type: "x",
        enabled: true,
        autoScaleYaxis: true
      },
      toolbar: {
        autoSelected: "zoom"
      }
    },
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 0
    },
    stroke: {
      curve: "smooth",
      width: 2
    },
    colors: ["#0b7285"],
    title: {
      text: `${product.name} Price Movement`,
      align: "left"
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100]
      }
    },
    yaxis: {
      labels: {
        formatter: (val) => `₹${Number(val).toFixed(2)}`
      },
      title: {
        text: "Price"
      }
    },
    xaxis: {
      type: "datetime"
    },
    tooltip: {
      shared: false,
      y: {
        formatter: (val) => `₹${Number(val).toFixed(2)}`
      }
    },
    noData: {
      text: "No price history available"
    }
  };

  const trendIcon = {
    rising: "📈",
    declining: "📉",
    neutral: "➡️"
  };

  const getTrendColor = (trend) => {
    if (trend === "rising") return "#d9480f";
    if (trend === "declining") return "#087e8b";
    return "#666";
  };

  return (
    <div className="card chart-card">
      <div className="card-title">Price Trend</div>
      {analytics && (
        <div className="analytics-grid">
          <div className="analytics-item">
            <div className="analytics-label">Current Price</div>
            <div className="analytics-value">₹{analytics.currentPrice?.toFixed(2)}</div>
          </div>
          <div className="analytics-item">
            <div className="analytics-label">Min / Max</div>
            <div className="analytics-value">₹{analytics.minPrice?.toFixed(2)} / ₹{analytics.maxPrice?.toFixed(2)}</div>
          </div>
          <div className="analytics-item">
            <div className="analytics-label">Average</div>
            <div className="analytics-value">₹{analytics.averagePrice?.toFixed(2)}</div>
          </div>
          <div className="analytics-item">
            <div className="analytics-label">Change</div>
            <div className="analytics-value" style={{ color: analytics.percentageChange < 0 ? "#087e8b" : "#d9480f" }}>
              {analytics.percentageChange > 0 ? "+" : ""}{analytics.percentageChange?.toFixed(2)}%
            </div>
          </div>
          <div className="analytics-item">
            <div className="analytics-label">Trend</div>
            <div className="analytics-value" style={{ color: getTrendColor(analytics.trend) }}>
              {trendIcon[analytics.trend]} {analytics.trend}
            </div>
          </div>
          <div className="analytics-item">
            <div className="analytics-label">Data Points</div>
            <div className="analytics-value">{analytics.dataPoints}</div>
          </div>
        </div>
      )}
      <div className="chart-wrapper">
        <ReactApexChart options={options} series={series} type="area" height={350} />
      </div>
    </div>
  );
};

export default PriceTrendChart;
