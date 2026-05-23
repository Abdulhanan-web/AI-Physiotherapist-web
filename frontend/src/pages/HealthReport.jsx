import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts";

import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HealthReport = () => {

    const { type } = useParams();

    const { token } = useAuth();

    const [report, setReport] = useState(null);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {

        const response = await fetch(
            `http://localhost:8000/generate-report-data/${type}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        setReport(data);
    };

    if (!report) {
        return <h1>Loading...</h1>;
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#111827",
                color: "white",
                padding: "40px"
            }}
        >

            <h1>
                {type.toUpperCase()} Health Report
            </h1>

            {/* SUMMARY CARDS */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: "20px",
                    marginTop: "30px"
                }}
            >

                <Card
                    title="Sessions"
                    value={report.summary.total_sessions}
                />

                <Card
                    title="Calories"
                    value={report.summary.total_calories}
                />

                <Card
                    title="Minutes"
                    value={report.summary.total_minutes}
                />

                <Card
                    title="Accuracy"
                    value={`${report.summary.average_accuracy}%`}
                />

            </div>

            {/* CHART */}

            <div
                style={{
                    marginTop: "50px",
                    background: "#1f2937",
                    padding: "20px",
                    borderRadius: "16px"
                }}
            >

                <h2>Recovery Progress</h2>

                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={report.report_data}>

                        <Line
                            type="monotone"
                            dataKey="avg_accuracy"
                            stroke="#2ecc71"
                            strokeWidth={4}
                        />

                        <CartesianGrid stroke="#444" />

                        <XAxis dataKey="period" />

                        <YAxis />

                        <Tooltip />

                    </LineChart>
                </ResponsiveContainer>

            </div>

            {/* CALORIES BAR CHART */}

            <div
                style={{
                    marginTop: "40px",
                    background: "#1f2937",
                    padding: "20px",
                    borderRadius: "16px"
                }}
            >

                <h2>Calories Burned</h2>

                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={report.report_data}>

                        <Bar
                            dataKey="calories"
                            fill="#3498db"
                        />

                        <CartesianGrid stroke="#444" />

                        <XAxis dataKey="period" />

                        <YAxis />

                        <Tooltip />

                    </BarChart>
                </ResponsiveContainer>

            </div>

            {/* DOWNLOAD BUTTON */}

            <button
                onClick={async () => {

                    try {

                        const response = await fetch(
                            `http://localhost:8000/generate-report/${type}`,
                            {
                                method: "GET",

                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        );

                        if (!response.ok) {

                            alert("Failed to download report");

                            return;
                        }

                        // Convert response to blob
                        const blob = await response.blob();

                        // Create downloadable URL
                        const url = window.URL.createObjectURL(blob);

                        // Create temporary anchor
                        const a = document.createElement("a");

                        a.href = url;

                        a.download = `${type}_health_report.pdf`;

                        document.body.appendChild(a);

                        a.click();

                        a.remove();

                        window.URL.revokeObjectURL(url);

                    } catch (error) {

                        console.error(error);

                        alert("Error downloading PDF");
                    }
                }}

                style={{
                    marginTop: "40px",
                    background: "#2ecc71",
                    padding: "15px 30px",
                    border: "none",
                    borderRadius: "12px",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    cursor: "pointer"
                }}
            >
                Download PDF Report
            </button>

        </div>
    );
};

const Card = ({ title, value }) => {

    return (
        <div
            style={{
                background: "#1f2937",
                padding: "30px",
                borderRadius: "16px",
                textAlign: "center"
            }}
        >

            <h3>{title}</h3>

            <h1
                style={{
                    color: "#2ecc71"
                }}
            >
                {value}
            </h1>

        </div>
    );
};

export default HealthReport;