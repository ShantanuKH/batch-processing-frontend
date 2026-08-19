import { useEffect, useMemo, useState } from "react";

import {
    startBatch,
    getExecutions,
    getSummary,
    getErrors,
    getEmployees
} from "./services/batchApi";

import "./App.css";


function App() {

    // ==================================================
    // STATE
    // ==================================================

    const [employees, setEmployees] = useState([]);

    const [executions, setExecutions] = useState([]);

    const [selectedExecution, setSelectedExecution] =
        useState(null);

    const [summary, setSummary] = useState(null);

    const [errors, setErrors] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [runningBatch, setRunningBatch] =
        useState(false);

    const [loadingExecution, setLoadingExecution] =
        useState(false);

    const [error, setError] = useState("");

    const [showAllEmployees, setShowAllEmployees] =
        useState(false);

    const [showErrors, setShowErrors] =
        useState(false);

    const [showAllExecutions, setShowAllExecutions] =
        useState(false);

    const [showAbout, setShowAbout] = useState(false);


    // ==================================================
    // LOAD EMPLOYEES
    // ==================================================

    const loadEmployees = async () => {

        try {

            const response = await getEmployees();

            setEmployees(response.data || []);

        } catch (err) {

            console.error(
                "Unable to load employees:",
                err
            );

            setError(
                "Unable to load employee data."
            );
        }
    };


    // ==================================================
    // LOAD EXECUTIONS
    // ==================================================

    const loadExecutions = async () => {

        try {

            const response =
                await getExecutions();

            const executionList =
                response.data || [];

            setExecutions(executionList);

            return executionList;

        } catch (err) {

            console.error(
                "Unable to load executions:",
                err
            );

            setError(
                "Unable to load batch executions."
            );

            return [];

        }
    };


    // ==================================================
    // LOAD SELECTED EXECUTION DETAILS
    // ==================================================

    const loadExecutionDetails = async (
        execution
    ) => {

        if (!execution) {
            return;
        }

        const executionId =
            execution.executionId ||
            execution.jobExecutionId ||
            execution.id;

        if (!executionId) {
            return;
        }

        setLoadingExecution(true);

        setError("");

        try {

            // -------------------------------
            // Load Summary
            // -------------------------------

            const summaryResponse =
                await getSummary(executionId);

            setSummary(
                summaryResponse.data || null
            );


            // -------------------------------
            // Load Errors
            // -------------------------------

            const errorResponse =
                await getErrors(executionId);

            setErrors(
                errorResponse.data || []
            );


            setSelectedExecution(
                execution
            );

            setShowErrors(false);

        } catch (err) {

            console.error(
                "Unable to load execution details:",
                err
            );

            setError(
                "Unable to load execution details."
            );

        } finally {

            setLoadingExecution(false);

        }
    };


    // ==================================================
    // LOAD LATEST EXECUTION
    // ==================================================

    const loadLatestSummary = async (
        executionList
    ) => {

        if (
            !executionList ||
            executionList.length === 0
        ) {

            setSelectedExecution(null);

            setSummary(null);

            setErrors([]);

            return;
        }

        await loadExecutionDetails(
            executionList[0]
        );
    };


    // ==================================================
    // LOAD COMPLETE DASHBOARD
    // ==================================================

    const loadDashboard = async () => {

        setLoading(true);

        setError("");

        try {

            await loadEmployees();

            const executionList =
                await loadExecutions();

            await loadLatestSummary(
                executionList
            );

        } catch (err) {

            console.error(
                "Dashboard loading error:",
                err
            );

            setError(
                "Unable to load dashboard data."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        loadDashboard();

    }, []);


    // ==================================================
    // RUN BATCH
    // ==================================================

    const handleRunBatch = async () => {

        if (runningBatch) {
            return;
        }

        setRunningBatch(true);

        setError("");

        try {

            await startBatch();


            /*
             * Give Spring Batch time to
             * create execution records.
             */

            await new Promise(
                resolve =>
                    setTimeout(resolve, 1000)
            );


            await loadDashboard();

        } catch (err) {

            console.error(
                "Batch execution error:",
                err
            );

            setError(
                "Unable to start batch processing."
            );

        } finally {

            setRunningBatch(false);
        }
    };


    // ==================================================
    // REFRESH
    // ==================================================

    const handleRefresh = async () => {

        await loadDashboard();
    };


    // ==================================================
    // VIEW ALL EXECUTIONS
    // ==================================================

    const handleViewAllExecutions = async () => {

        setError("");

        const executionList =
            await loadExecutions();

        setShowAllExecutions(true);

        setSelectedExecution(null);

        setSummary(null);

        setErrors([]);

        if (
            executionList.length === 0
        ) {

            setShowAllExecutions(true);
        }
    };


    // ==================================================
    // SELECT EXECUTION
    // ==================================================

    const handleSelectExecution = async (
        execution
    ) => {

        setShowAllExecutions(false);

        await loadExecutionDetails(
            execution
        );
    };


    // ==================================================
    // SEARCH EMPLOYEES
    // ==================================================

    const filteredEmployees =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {

                return employees;
            }

            return employees.filter(
                employee => {

                    return (

                        String(
                            employee.employeeID || ""
                        )
                            .toLowerCase()
                            .includes(query)

                        ||

                        String(
                            employee.name || ""
                        )
                            .toLowerCase()
                            .includes(query)

                        ||

                        String(
                            employee.department || ""
                        )
                            .toLowerCase()
                            .includes(query)
                    );
                }
            );

        }, [employees, search]);


    // ==================================================
    // EMPLOYEES TO DISPLAY
    // ==================================================

    const displayedEmployees =
        showAllEmployees
            ? filteredEmployees
            : filteredEmployees.slice(0, 5);


    // ==================================================
    // STATS
    // ==================================================

    const totalRecords =
        summary?.totalRecords ??
        employees.length;


    const successfulRecords =
        summary?.successfulRecords ??
        employees.length;


    const failedRecords =
        summary?.failedRecords ??
        errors.length;


    const successRate =
        summary?.successRate ??
        (
            totalRecords > 0
                ? Math.round(
                    (
                        successfulRecords /
                        totalRecords
                    ) * 100
                )
                : 0
        );


    // ==================================================
    // FORMAT EXECUTION ID
    // ==================================================

    const getExecutionId = (
        execution
    ) => {

        return (
            execution?.executionId ||
            execution?.jobExecutionId ||
            execution?.id ||
            "N/A"
        );
    };


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div className="app">


            {/* ==================================================
                HEADER
            ================================================== */}

            <header className="topbar">

                <div>

                    <div className="brand">
                        Spring Batch Monitor
                    </div>

                    <div className="subtitle">
                        Employee Data Processing
                    </div>

                </div>


                <div className="header-actions">

                    <button
                        className="secondary-btn"
                        onClick={handleRefresh}
                        disabled={
                            loading ||
                            runningBatch
                        }
                    >
                        ↻ Refresh
                    </button>


                    <button
                        className="primary-btn"
                        onClick={handleRunBatch}
                        disabled={runningBatch}
                    >

                        {runningBatch
                            ? "Running..."
                            : "▶ Run Batch"}

                    </button>

                </div>

            </header>


            {/* ==================================================
                ERROR ALERT
            ================================================== */}

            {error && (

                <div className="alert">

                    <span>
                        {error}
                    </span>

                    <button
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>

                </div>

            )}


            {/* ==================================================
                HERO
            ================================================== */}

            <section className="hero">

    <div className="hero-content">

        <span className="eyebrow">
            BATCH MONITORING
        </span>

        <h1>
            Employee Data Processing
        </h1>

        <p>
            Process employee records in batches,
            validate incoming data, handle invalid
            records safely, and monitor every execution.
        </p>

        <div className="hero-actions">

            <button
                className="hero-info-btn"
                onClick={() => setShowAbout(true)}
            >
                <span>ⓘ</span>
                About Application
            </button>

        </div>

    </div>

    <div className="hero-status">

        <span className="status-dot"></span>

        System Ready

    </div>


</section>



            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <section className="stats-grid">


                <div className="stat-card">

                    <div className="stat-label">
                        TOTAL RECORDS
                    </div>

                    <div className="stat-value">
                        {totalRecords}
                    </div>

                    <div className="stat-description">
                        Records processed
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-label">
                        SUCCESSFUL
                    </div>

                    <div className="stat-value success">
                        {successfulRecords}
                    </div>

                    <div className="stat-description">
                        Successfully stored
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-label">
                        FAILED
                    </div>

                    <div className="stat-value danger">
                        {failedRecords}
                    </div>

                    <div className="stat-description">
                        Validation / processing errors
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-label">
                        SUCCESS RATE
                    </div>

                    <div className="stat-value">
                        {successRate}%
                    </div>

                    <div className="stat-description">
                        Latest execution
                    </div>

                </div>

            </section>


            {/* ==================================================
                EXECUTION SUMMARY
            ================================================== */}

            <section className="section">

                <div className="section-header">

                    <div>

                        <span className="eyebrow">
                            BATCH MONITORING
                        </span>

                        <h2>
                            Execution Summary
                        </h2>

                        <p>
                            Overview of the latest employee
                            batch execution.
                        </p>

                    </div>


                    <button
                        className="view-all-btn"
                        onClick={
                            handleViewAllExecutions
                        }
                    >
                        View All Executions
                    </button>

                </div>


                {/* ==================================================
                    ALL EXECUTIONS
                ================================================== */}

                {showAllExecutions && (

                    <div className="execution-list-card">

                        <div className="execution-list-header">

                            <div>

                                <h3>
                                    All Batch Executions
                                </h3>

                                <p>
                                    Select an execution to view
                                    its summary and errors.
                                </p>

                            </div>


                            <button
                                className="outline-btn"
                                onClick={() => {

                                    setShowAllExecutions(
                                        false
                                    );

                                    if (
                                        executions.length > 0
                                    ) {

                                        loadExecutionDetails(
                                            executions[0]
                                        );
                                    }
                                }}
                            >
                                Latest Execution
                            </button>

                        </div>


                        {executions.length > 0 ? (

                            <div className="execution-table-wrapper">

                                <table>

                                    <thead>

                                        <tr>

                                            <th>
                                                Execution ID
                                            </th>

                                            <th>
                                                Job
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Start Time
                                            </th>

                                            <th>
                                                Action
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {executions.map(
                                            (execution, index) => {

                                                const executionId =
                                                    getExecutionId(
                                                        execution
                                                    );


                                                return (

                                                    <tr
                                                        key={
                                                            executionId ||
                                                            index
                                                        }
                                                    >

                                                        <td>
                                                            #
                                                            {
                                                                executionId
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                execution.jobName ||
                                                                execution.job ||
                                                                "employee-job"
                                                            }
                                                        </td>


                                                        <td>

                                                            <span className="status-badge">

                                                                {
                                                                    execution.status ||
                                                                    "UNKNOWN"
                                                                }

                                                            </span>

                                                        </td>


                                                        <td>
                                                            {
                                                                execution.startTime ||
                                                                execution.start_time ||
                                                                "—"
                                                            }
                                                        </td>


                                                        <td>

                                                            <button
                                                                className="small-primary"
                                                                onClick={() =>
                                                                    handleSelectExecution(
                                                                        execution
                                                                    )
                                                                }
                                                            >
                                                                View Details
                                                            </button>

                                                        </td>

                                                    </tr>

                                                );
                                            }
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        ) : (

                            <div className="empty-card">

                                No batch executions found.

                                <button
                                    className="small-primary"
                                    onClick={
                                        handleRunBatch
                                    }
                                >
                                    Run Batch
                                </button>

                            </div>

                        )}

                    </div>

                )}


                {/* ==================================================
                    LOADING EXECUTION
                ================================================== */}

                {loadingExecution && (

                    <div className="empty-card">

                        Loading execution details...

                    </div>

                )}


                {/* ==================================================
                    SELECTED SUMMARY
                ================================================== */}

                {!showAllExecutions &&
                    !loadingExecution &&
                    (

                        summary ? (

                            <div className="summary-panel">


                                <div className="summary-item">

                                    <span>
                                        Execution ID
                                    </span>

                                    <strong>
                                        #
                                        {
                                            summary.executionId
                                        }
                                    </strong>

                                </div>


                                <div className="summary-item">

                                    <span>
                                        Job
                                    </span>

                                    <strong>
                                        {
                                            summary.jobName ||
                                            "employee-job"
                                        }
                                    </strong>

                                </div>


                                <div className="summary-item">

                                    <span>
                                        Status
                                    </span>

                                    <strong className="status-badge">
                                        {
                                            summary.status
                                        }
                                    </strong>

                                </div>


                                <div className="summary-item">

                                    <span>
                                        Successful
                                    </span>

                                    <strong>
                                        {
                                            summary.successfulRecords
                                        }
                                    </strong>

                                </div>


                                <div className="summary-item">

                                    <span>
                                        Failed
                                    </span>

                                    <strong className="danger-text">
                                        {
                                            summary.failedRecords
                                        }
                                    </strong>

                                </div>


                                <div className="summary-item">

                                    <span>
                                        Success Rate
                                    </span>

                                    <strong>
                                        {
                                            summary.successRate
                                        }%
                                    </strong>

                                </div>

                            </div>

                        ) : (

                            <div className="empty-card">

                                <p>
                                    No batch execution summary available.
                                </p>

                                <button
                                    className="small-primary"
                                    onClick={
                                        handleRunBatch
                                    }
                                >
                                    Run First Batch
                                </button>

                            </div>

                        )
                    )}

            </section>


            {/* ==================================================
                EMPLOYEES
            ================================================== */}

            <section className="section">

                <div className="section-header employee-header">

                    <div>

                        <span className="eyebrow">
                            PROCESSED DATA
                        </span>

                        <h2>
                            Employees
                        </h2>

                        <p>
                            Successfully processed employee
                            records stored in PostgreSQL.
                        </p>

                    </div>


                    <button
                        className="outline-btn"
                        onClick={() =>
                            setShowAllEmployees(
                                !showAllEmployees
                            )
                        }
                    >

                        {showAllEmployees
                            ? "Show Less"
                            : `View All (${employees.length})`}

                    </button>

                </div>


                <div className="table-card">


                    {/* SEARCH */}

                    <div className="table-toolbar">

                        <input
                            type="text"
                            placeholder="Search by ID, name or department..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />


                        <span>
                            {
                                filteredEmployees.length
                            } records
                        </span>

                    </div>


                    {/* EMPLOYEE TABLE */}

                    {displayedEmployees.length > 0 ? (

                        <div className="table-wrapper">

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            ID
                                        </th>

                                        <th>
                                            Name
                                        </th>

                                        <th>
                                            Department
                                        </th>

                                        <th>
                                            Start Date
                                        </th>

                                        <th>
                                            End Date
                                        </th>

                                        <th>
                                            Duration
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {displayedEmployees.map(
                                        employee => (

                                            <tr
                                                key={
                                                    employee.employeeID
                                                }
                                            >

                                                <td>
                                                    #
                                                    {
                                                        employee.employeeID
                                                    }
                                                </td>


                                                <td className="employee-name">
                                                    {
                                                        employee.name
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        employee.department
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        employee.startDate
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        employee.endDate ||
                                                        "Active"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        employee.totalDurationInCompany
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    ) : (

                        <div className="empty-table">

                            No employee records found.

                        </div>

                    )}

                </div>

            </section>


            {/* ==================================================
                ERRORS
            ================================================== */}

            <section className="section">

                <div className="section-header employee-header">

                    <div>

                        <span className="eyebrow">
                            EXCEPTION MONITORING
                        </span>

                        <h2>
                            Processing Errors
                        </h2>

                        <p>
                            Records skipped during the selected
                            batch execution.
                        </p>

                    </div>


                    {errors.length > 0 && (

                        <button
                            className={
                                showErrors
                                    ? "outline-btn danger-outline"
                                    : "outline-btn"
                            }
                            onClick={() =>
                                setShowErrors(
                                    !showErrors
                                )
                            }
                        >

                            {showErrors
                                ? "Hide Errors"
                                : `View Errors (${errors.length})`}

                        </button>

                    )}

                </div>


                {/* ==================================================
                    ERROR LIST
                ================================================== */}

                {showErrors &&
                    errors.length > 0 && (

                        <div className="error-list">

                            {errors.map(
                                batchError => (

                                    <div
                                        className="error-card"
                                        key={
                                            batchError.id
                                        }
                                    >

                                        <div className="error-top">

                                            <div>

                                                <strong>
                                                    Employee #
                                                    {
                                                        batchError.employeeId ??
                                                        "Unknown"
                                                    }
                                                </strong>


                                                {batchError.employeeName && (

                                                    <span>
                                                        {" "}
                                                        —{" "}
                                                        {
                                                            batchError.employeeName
                                                        }
                                                    </span>

                                                )}

                                            </div>


                                            <span className="error-badge">
                                                {
                                                    batchError.errorType
                                                }
                                            </span>

                                        </div>


                                        {/* Department */}

                                        {batchError.department && (

                                            <div className="error-meta">

                                                Department:
                                                {" "}
                                                {
                                                    batchError.department
                                                }

                                            </div>

                                        )}


                                        {/* Dates */}

                                        {(batchError.startDate ||
                                            batchError.endDate) && (

                                            <div className="error-dates">

                                                {batchError.startDate && (

                                                    <>
                                                        Start:
                                                        {" "}
                                                        {
                                                            batchError.startDate
                                                        }
                                                    </>

                                                )}


                                                {batchError.endDate && (

                                                    <>
                                                        {" "}
                                                        → End:
                                                        {" "}
                                                        {
                                                            batchError.endDate
                                                        }
                                                    </>

                                                )}

                                            </div>

                                        )}


                                        {/* Error */}

                                        <div className="error-message">

                                            {
                                                batchError.errorMessage
                                            }

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}


                {/* ==================================================
                    NO ERRORS
                ================================================== */}

                {errors.length === 0 && (

                    <div className="no-errors">

                        <span>
                            ✓
                        </span>

                        No errors recorded for the
                        selected batch execution.

                    </div>

                )}

            </section>


            {/* ==================================================
                FOOTER
            ================================================== */}

            <footer>

                <span>
                    Spring Boot Batch Processing
                </span>

                <span>
                    PostgreSQL • Spring Batch
                </span>

            </footer>

            {showAbout && (
    <div
        className="modal-overlay"
        onClick={() => setShowAbout(false)}
    >

        <div
            className="about-modal"
            onClick={(e) => e.stopPropagation()}
        >

            <div className="modal-header">

                <div>
                    <span className="eyebrow">
                        ABOUT THE APPLICATION
                    </span>

                    <h2>
                        Employee Batch Processing
                    </h2>
                </div>

                <button
                    className="modal-close"
                    onClick={() => setShowAbout(false)}
                >
                    ×
                </button>

            </div>


            <div className="modal-content">

                <div className="about-block">

                    <h3>What does this application do?</h3>

                    <p>
                        This application is a Spring Boot based batch
                        processing system designed to process employee
                        records efficiently in batches.
                    </p>

                    <p>
                        It reads employee data, validates each record,
                        processes valid records, and safely handles
                        records that cannot be processed.
                    </p>

                </div>


                <div className="about-block">

                    <h3>How does it work?</h3>

                    <div className="workflow">

                        <div className="workflow-step">
                            <span>01</span>
                            <div>
                                <strong>Read</strong>
                                <p>
                                    Employee records are loaded from
                                    the input data source.
                                </p>
                            </div>
                        </div>


                        <div className="workflow-step">
                            <span>02</span>
                            <div>
                                <strong>Process</strong>
                                <p>
                                    Records are validated and processed
                                    using Spring Batch.
                                </p>
                            </div>
                        </div>


                        <div className="workflow-step">
                            <span>03</span>
                            <div>
                                <strong>Handle Errors</strong>
                                <p>
                                    Invalid records are skipped safely
                                    and their error details are captured.
                                </p>
                            </div>
                        </div>


                        <div className="workflow-step">
                            <span>04</span>
                            <div>
                                <strong>Monitor</strong>
                                <p>
                                    Execution status, record counts,
                                    success rate and errors can be monitored.
                                </p>
                            </div>
                        </div>

                    </div>

                </div>


                <div className="about-grid">

                    <div className="about-card">

                        <span className="about-card-icon">
                            ⚙
                        </span>

                        <h3>Spring Boot</h3>

                        <p>
                            Provides the REST APIs and application
                            infrastructure.
                        </p>

                    </div>


                    <div className="about-card">

                        <span className="about-card-icon">
                            ⚡
                        </span>

                        <h3>Spring Batch</h3>

                        <p>
                            Handles chunk-based processing,
                            execution tracking and fault tolerance.
                        </p>

                    </div>


                    <div className="about-card">

                        <span className="about-card-icon">
                            ◈
                        </span>

                        <h3>PostgreSQL</h3>

                        <p>
                            Stores employee data, batch executions,
                            summaries and error information.
                        </p>

                    </div>


                    <div className="about-card">

                        <span className="about-card-icon">
                            ↗
                        </span>

                        <h3>REST API</h3>

                        <p>
                            Exposes batch execution, summary,
                            employee and error information.
                        </p>

                    </div>

                </div>


                <div className="about-block">

                    <h3>What can you monitor?</h3>

                    <ul className="feature-list">

                        <li>
                            <span>✓</span>
                            Start and monitor batch executions
                        </li>

                        <li>
                            <span>✓</span>
                            View execution history
                        </li>

                        <li>
                            <span>✓</span>
                            Track processed and successful records
                        </li>

                        <li>
                            <span>✓</span>
                            Monitor failed records
                        </li>

                        <li>
                            <span>✓</span>
                            View success rate
                        </li>

                        <li>
                            <span>✓</span>
                            Inspect detailed employee errors
                        </li>

                    </ul>

                </div>

            </div>


            <div className="modal-footer">

                <span>
                    Employee Batch Processing &nbsp;•&nbsp;
                    Spring Boot + Spring Batch
                </span>

                <button
                    className="modal-done-btn"
                    onClick={() => setShowAbout(false)}
                >
                    Got it
                </button>

            </div>

        </div>

    </div>
)}

        </div>
    );

    
}


export default App;