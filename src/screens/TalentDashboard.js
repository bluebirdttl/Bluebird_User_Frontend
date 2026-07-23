import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_URL } from "../config";
import Loader from "../components/Loader";
import { Container, Row, Col, Card, Alert } from "react-bootstrap";

// Hook to track last updated time for specific data
const useLastUpdated = (data) => {
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleDateString());
    const prevDataRef = React.useRef(data);

    useEffect(() => {
        // Simple deep comparison via JSON.stringify
        if (JSON.stringify(data) !== JSON.stringify(prevDataRef.current)) {
            setLastUpdated(new Date().toLocaleDateString());
            prevDataRef.current = data;
        }
    }, [data]);

    return lastUpdated;
};

export default function DashboardPage({ onLogout }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState({
        partialHoursDistribution: {},
        clusters: { "MEBM": 0, "M&T": 0, "S&PS Insitu": 0, "S&PS Exsitu": 0 },
        roles: {},
        today: { totalPartialHours: 0, totalAvailableHours: 0, partialEmployeeCount: 0, availableEmployeeCount: 0 },
        weekly: { totalPartialHours: 0, totalAvailableHours: 0, partialEmployeeCount: 0, availableEmployeeCount: 0 },
        monthly: { totalPartialHours: 0, totalAvailableHours: 0, partialEmployeeCount: 0, availableEmployeeCount: 0 }
    });

    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Calculate last updated times
    const todayCapacityData = { partial: metrics.today?.totalPartialHours, available: metrics.today?.totalAvailableHours };
    const todayCapacityLastUpdated = useLastUpdated(todayCapacityData);

    const weeklyCapacityData = { partial: metrics.weekly?.totalPartialHours, available: metrics.weekly?.totalAvailableHours };
    const weeklyCapacityLastUpdated = useLastUpdated(weeklyCapacityData);

    const monthlyCapacityData = { partial: metrics.monthly?.totalPartialHours, available: metrics.monthly?.totalAvailableHours };
    const monthlyCapacityLastUpdated = useLastUpdated(monthlyCapacityData);

    const clustersLastUpdated = useLastUpdated(metrics.clusters);
    const rolesLastUpdated = useLastUpdated(metrics.roles);


    useEffect(() => {
        const storedUser = sessionStorage.getItem("user");
        if (!storedUser) {
            if (onLogout) onLogout();
            else navigate("/");
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if ((parsedUser.role_type || "").trim().toLowerCase() !== "manager") {
            navigate("/home");
        }
    }, [navigate, onLogout]);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const extractCapacity = (data, key) => {
                    if (!data) return { totalPartialHours: 0, totalAvailableHours: 0, partialEmployeeCount: 0, availableEmployeeCount: 0 };
                    if (data[key] && (data[key].totalAvailableHours !== undefined || data[key].totalPartialHours !== undefined)) {
                        return data[key];
                    }
                    return {
                        totalPartialHours: data.totalPartialHours || 0,
                        totalAvailableHours: data.totalAvailableHours || 0,
                        partialEmployeeCount: data.partialEmployeeCount || 0,
                        availableEmployeeCount: data.availableEmployeeCount || 0
                    };
                };

                const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
                    fetch(`${API_URL}/api/employees/dashboard-metrics?range=Daily`),
                    fetch(`${API_URL}/api/employees/dashboard-metrics?range=Weekly`),
                    fetch(`${API_URL}/api/employees/dashboard-metrics?range=Monthly`)
                ]);

                if (!dailyRes.ok || !weeklyRes.ok || !monthlyRes.ok) {
                    throw new Error("Failed to fetch dashboard metrics");
                }

                const dailyData = await dailyRes.json();
                const weeklyData = await weeklyRes.json();
                const monthlyData = await monthlyRes.json();

                setMetrics({
                    clusters: dailyData.clusters || {},
                    roles: dailyData.roles || {},
                    today: extractCapacity(dailyData, "today"),
                    weekly: extractCapacity(weeklyData, "weekly"),
                    monthly: extractCapacity(monthlyData, "monthly")
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            sessionStorage.clear();
            navigate("/");
        }
    };

    // --- Components ---

    const ChartCard = ({ title, action, children, updatedAt }) => (
        <Card
            className="h-100 shadow-sm border-0"
            style={{ borderRadius: "0px", backgroundColor: "#ecf4f8ff", transition: "all 0.25s ease", cursor: "pointer" }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)"
                e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.09)"
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = ""
            }}
        >
            <Card.Body className="d-flex flex-column p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <h3 className="h5 fw-bold text-dark m-0">{title}</h3>
                    {action && <div>{action}</div>}
                </div>
                <div className="flex-grow-1 d-flex justify-content-center align-items-center w-100">
                    {children}
                </div>
                <div className="text-muted small text-end mt-4 pt-2 border-top">
                    Updated at {updatedAt || new Date().toLocaleDateString()}
                </div>
            </Card.Body>
        </Card>
    );

    // New Chart for Capacity Totals (Vertical Comparison)
    const CapacityComparisonChart = ({ partial, available, partialCount, availableCount }) => {
        const data = [
            { label: "Partial Available", value: partial, color: "#f59e0b", count: partialCount },
            { label: "Available", value: available, color: "#22c55e", count: availableCount }
        ];
        const maxVal = Math.max(partial, available, 10);

        // Responsive SVG settings
        const viewBoxWidth = 400;
        const viewBoxHeight = 300;
        const padding = { top: 40, right: 20, bottom: 60, left: 50 };
        const innerWidth = viewBoxWidth - padding.left - padding.right;
        const innerHeight = viewBoxHeight - padding.top - padding.bottom;
        const barWidth = 60;

        return (
            <div className="w-100 h-100 d-flex flex-column pb-3">
                <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                    <svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }}>
                        {/* Y-Axis Grid */}
                        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                            const y = padding.top + innerHeight * (1 - t);
                            const val = Math.round(maxVal * t);
                            return (
                                <g key={t}>
                                    <line x1={padding.left} y1={y} x2={viewBoxWidth - padding.right} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                                    <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#9ca3af">{val}</text>
                                </g>
                            );
                        })}

                        {/* Bars */}
                        {data.map((d, i) => {
                            const x = padding.left + (innerWidth / 4) + (i * (innerWidth / 2)) - (barWidth / 2);
                            const barHeight = (d.value / maxVal) * innerHeight;
                            const y = padding.top + innerHeight - barHeight;

                            return (
                                <g key={d.label}>
                                    <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={barHeight}
                                        fill={d.color}
                                        rx="4"
                                    />
                                    <text x={x + barWidth / 2} y={y - 10} textAnchor="middle" fontSize="14" fontWeight="bold" fill={d.color}>
                                        {d.value}h
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
                {/* Legend */}
                <div className="d-flex flex-column gap-2 mt-3 small text-secondary align-self-start ps-2">
                    <div className="d-flex align-items-center gap-2">
                        <div style={{ width: "12px", height: "12px", background: "#f59e0b", borderRadius: "2px" }}></div>
                        <span>Total Partial Hours ({partialCount || 0} people)</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <div style={{ width: "12px", height: "12px", background: "#22c55e", borderRadius: "2px" }}></div>
                        <span>Total Available Hours ({availableCount || 0} people)</span>
                    </div>
                </div>
            </div>
        );
    };

    // Horizontal Bar Chart for Clusters
    const HorizontalBarChart = ({ data, color = "#3b82f6" }) => {
        const entries = Object.entries(data);
        if (entries.length === 0) return <div className="text-muted fst-italic">No data available</div>;

        const maxVal = Math.max(...Object.values(data), 1);

        return (
            <div className="d-flex flex-column gap-3 w-100">
                {entries.map(([key, val]) => (
                    <div key={key} className="d-flex align-items-center gap-3">
                        <div style={{ width: "100px", fontSize: "13px", textAlign: "right", flexShrink: 0 }} className="text-secondary text-truncate">
                            {key}
                        </div>
                        <div className="flex-grow-1 bg-light rounded position-relative d-flex align-items-center overflow-hidden" style={{ height: "24px" }}>
                            <div
                                style={{
                                    height: "100%",
                                    width: `${(val / maxVal) * 100}%`,
                                    background: color,
                                    borderRadius: "4px",
                                    transition: "width 0.5s ease-out"
                                }}
                            />
                            <span className="position-absolute end-0 me-2 small fw-bold text-dark">{val}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Pie Chart for Roles (SVG)
    const PieChart = ({ data }) => {
        const entries = Object.entries(data);
        if (entries.length === 0) return <div className="text-muted fst-italic">No data available</div>;

        const total = Object.values(data).reduce((a, b) => a + b, 0);
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"];

        let cumulativePercent = 0;

        const slices = entries.map(([label, val], idx) => {
            const percent = val / total;
            const startPercent = cumulativePercent;
            cumulativePercent += percent;
            const endPercent = cumulativePercent;

            const getCoords = (p) => {
                const x = Math.cos(2 * Math.PI * p);
                const y = Math.sin(2 * Math.PI * p);
                return [x, y];
            };

            const [startX, startY] = getCoords(startPercent);
            const [endX, endY] = getCoords(endPercent);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

            return {
                label,
                val,
                percent,
                color: colors[idx % colors.length],
                pathData
            };
        });

        return (
            <div className="d-flex flex-column align-items-center w-100 gap-4">
                <svg viewBox="-1 -1 2 2" style={{ width: "160px", height: "160px", transform: "rotate(-90deg)" }}>
                    {slices.map((slice) => (
                        <path
                            key={slice.label}
                            d={slice.pathData}
                            fill={slice.color}
                            stroke="white"
                            strokeWidth="0.02"
                            style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                            onMouseOver={(e) => e.target.style.opacity = 0.8}
                            onMouseOut={(e) => e.target.style.opacity = 1}
                        >
                            <title>{`${slice.label}: ${slice.val} (${(slice.percent * 100).toFixed(1)}%)`}</title>
                        </path>
                    ))}
                </svg>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                    {slices.map((item) => (
                        <div key={item.label} className="d-flex align-items-center gap-1 small text-dark">
                            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color }} />
                            <span>{item.label} ({item.val})</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="vh-100 d-flex justify-content-center align-items-center">
            <Loader />
        </div>
    );

    return (
        <div className="min-vh-100 bg-light">
            <Navbar user={user} onLogout={handleLogout} title="Talent Dashboard " />

            <Container fluid="lg" className="py-4">
                {error && (
                    <Alert variant="danger" className="mb-4">
                        Error loading data: {error}
                    </Alert>
                )}

                {/* Line 1: Today, This Week, This Month Capacity Cards */}
                <Row className="g-4 mb-4">
                    {/* 1. Today Capacity Overview */}
                    <Col xs={12} md={4}>
                        <ChartCard
                            title="Capacity Overview - Today"
                            updatedAt={todayCapacityLastUpdated}
                        >
                            <div className="w-100 h-100 d-flex flex-column">
                                <span className="small text-muted mb-2">Assuming 8 hrs/day per person</span>
                                <div style={{ minHeight: "300px", width: "100%" }}>
                                    <CapacityComparisonChart
                                        partial={metrics.today?.totalPartialHours || 0}
                                        available={metrics.today?.totalAvailableHours || 0}
                                        partialCount={metrics.today?.partialEmployeeCount || 0}
                                        availableCount={metrics.today?.availableEmployeeCount || 0}
                                    />
                                </div>
                            </div>
                        </ChartCard>
                    </Col>

                    {/* 2. This Week Capacity Overview */}
                    <Col xs={12} md={4}>
                        <ChartCard
                            title="Capacity Overview - This Week"
                            updatedAt={weeklyCapacityLastUpdated}
                        >
                            <div className="w-100 h-100 d-flex flex-column">
                                <span className="small text-muted mb-2">Remaining days in current week</span>
                                <div style={{ minHeight: "300px", width: "100%" }}>
                                    <CapacityComparisonChart
                                        partial={metrics.weekly?.totalPartialHours || 0}
                                        available={metrics.weekly?.totalAvailableHours || 0}
                                        partialCount={metrics.weekly?.partialEmployeeCount || 0}
                                        availableCount={metrics.weekly?.availableEmployeeCount || 0}
                                    />
                                </div>
                            </div>
                        </ChartCard>
                    </Col>

                    {/* 3. This Month Capacity Overview */}
                    <Col xs={12} md={4}>
                        <ChartCard
                            title="Capacity Overview - This Month"
                            updatedAt={monthlyCapacityLastUpdated}
                        >
                            <div className="w-100 h-100 d-flex flex-column">
                                <span className="small text-muted mb-2">Assuming 176 hrs/month per person</span>
                                <div style={{ minHeight: "300px", width: "100%" }}>
                                    <CapacityComparisonChart
                                        partial={metrics.monthly?.totalPartialHours || 0}
                                        available={metrics.monthly?.totalAvailableHours || 0}
                                        partialCount={metrics.monthly?.partialEmployeeCount || 0}
                                        availableCount={metrics.monthly?.availableEmployeeCount || 0}
                                    />
                                </div>
                            </div>
                        </ChartCard>
                    </Col>
                </Row>

                {/* Line 2: Cluster and Role Distribution Cards */}
                <Row className="g-4">
                    {/* 4. Users per Cluster */}
                    <Col xs={12} md={6}>
                        <ChartCard title="Cluster based Distribution" updatedAt={clustersLastUpdated}>
                            <HorizontalBarChart data={metrics.clusters} color="#3b82f6" />
                        </ChartCard>
                    </Col>

                    {/* 5. Users per Role */}
                    <Col xs={12} md={6}>
                        <ChartCard title="Role based Distribution" updatedAt={rolesLastUpdated}>
                            <PieChart data={metrics.roles} />
                        </ChartCard>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
