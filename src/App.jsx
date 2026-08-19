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



 {/* About Section Information */}

{showAbout && (
    <div
        className="modal-overlay"
        onClick={() => setShowAbout(false)}
    >

        <div
            className="about-modal"
            onClick={(e) => e.stopPropagation()}
        >

            {/* =====================================================
                HEADER
            ====================================================== */}

            <div className="modal-header">

                <div>

                    <span className="eyebrow">
                        PROJECT DOCUMENTATION
                    </span>

                    <h2>
                        Employee Batch Processing
                    </h2>

                    <p className="modal-subtitle">
                        A production-style Spring Boot and Spring Batch
                        prototype for reliable, fault-tolerant employee
                        data processing and execution monitoring.
                    </p>

                </div>

                <button
                    className="modal-close"
                    onClick={() => setShowAbout(false)}
                    aria-label="Close documentation"
                >
                    ×
                </button>

            </div>


            {/* =====================================================
                DOCUMENTATION CONTENT
            ====================================================== */}

            <div className="modal-content">


                {/* =================================================
                    01 — PROJECT OVERVIEW
                ================================================= */}

                <section className="doc-section">

                    <span className="doc-number">
                        01 — PROJECT OVERVIEW
                    </span>

                    <h3>
                        Why was this application created?
                    </h3>

                    <p>
                        Employee data is often received in bulk through
                        files such as CSVs. Processing these records
                        manually or through simple database scripts can
                        become difficult when the dataset grows or when
                        individual records contain invalid information.
                    </p>

                    <p>
                        This prototype demonstrates how that traditional
                        workflow can be transformed into an automated,
                        reliable and observable batch-processing pipeline.
                    </p>

                    <div className="highlight-box">

                        <strong>
                            The primary objective
                        </strong>

                        <span>
                            Process large numbers of employee records
                            automatically while validating data, handling
                            failures safely, preserving error information
                            and providing complete execution visibility.
                        </span>

                    </div>

                </section>


                {/* =================================================
                    02 — WHAT THE SYSTEM DOES
                ================================================= */}

                <section className="doc-section">

                    <span className="doc-number">
                        02 — WHAT THE SYSTEM DOES
                    </span>

                    <h3>
                        End-to-end batch processing
                    </h3>

                    <div className="process-grid">

                        <div className="process-card">

                            <div className="process-icon">
                                01
                            </div>

                            <div>
                                <strong>
                                    Read
                                </strong>

                                <p>
                                    Reads employee records from a CSV
                                    input file using Spring Batch.
                                </p>
                            </div>

                        </div>


                        <div className="process-card">

                            <div className="process-icon">
                                02
                            </div>

                            <div>
                                <strong>
                                    Validate
                                </strong>

                                <p>
                                    Validates employee ID, name,
                                    department and date information.
                                </p>
                            </div>

                        </div>


                        <div className="process-card">

                            <div className="process-icon">
                                03
                            </div>

                            <div>
                                <strong>
                                    Process
                                </strong>

                                <p>
                                    Parses dates and calculates the
                                    employee duration in days.
                                </p>
                            </div>

                        </div>


                        <div className="process-card">

                            <div className="process-icon">
                                04
                            </div>

                            <div>
                                <strong>
                                    Write
                                </strong>

                                <p>
                                    Stores successfully processed
                                    employee records in PostgreSQL.
                                </p>
                            </div>

                        </div>


                        <div className="process-card">

                            <div className="process-icon">
                                05
                            </div>

                            <div>
                                <strong>
                                    Handle Errors
                                </strong>

                                <p>
                                    Invalid records are skipped without
                                    stopping the complete batch.
                                </p>
                            </div>

                        </div>


                        <div className="process-card">

                            <div className="process-icon">
                                06
                            </div>

                            <div>
                                <strong>
                                    Monitor
                                </strong>

                                <p>
                                    Execution statistics, errors and
                                    success rates are exposed through APIs.
                                </p>
                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    03 — PROCESSING LOGIC
                ================================================= */}

                <section className="doc-section">

                    <span className="doc-number">
                        03 — PROCESSING LOGIC
                    </span>

                    <h3>
                        What happens to an employee record?
                    </h3>

                    <div className="workflow-large">

                        <div className="workflow-large-step">

                            <span>
                                01
                            </span>

                            <div>
                                <strong>
                                    CSV Input
                                </strong>

                                <p>
                                    Employee data enters the system
                                    through the configured CSV file.
                                </p>
                            </div>

                        </div>


                        <div className="workflow-connector" />


                        <div className="workflow-large-step">

                            <span>
                                02
                            </span>

                            <div>
                                <strong>
                                    Validation
                                </strong>

                                <p>
                                    Employee ID, name, department and
                                    date fields are checked for validity.
                                </p>
                            </div>

                        </div>


                        <div className="workflow-connector" />


                        <div className="workflow-large-step">

                            <span>
                                03
                            </span>

                            <div>
                                <strong>
                                    Business Calculation
                                </strong>

                                <p>
                                    Start and end dates are parsed and
                                    the employee's duration is calculated
                                    using the date difference.
                                </p>
                            </div>

                        </div>


                        <div className="workflow-connector" />


                        <div className="workflow-large-step">

                            <span>
                                04
                            </span>

                            <div>
                                <strong>
                                    Database Persistence
                                </strong>

                                <p>
                                    Valid records are inserted or updated
                                    in PostgreSQL using an upsert operation.
                                </p>
                            </div>

                        </div>


                        <div className="workflow-connector" />


                        <div className="workflow-large-step">

                            <span>
                                05
                            </span>

                            <div>
                                <strong>
                                    Monitoring
                                </strong>

                                <p>
                                    Execution details, record counts,
                                    failures and success rates become
                                    available through the dashboard.
                                </p>
                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    04 — VALIDATION
                ================================================= */}

                <section className="doc-section">

                    <span className="doc-number">
                        04 — DATA VALIDATION
                    </span>

                    <h3>
                        What validations are performed?
                    </h3>

                    <div className="validation-grid">

                        <div>
                            <span>✓</span>
                            <strong>Employee ID</strong>
                            <p>
                                Must contain a valid positive value.
                            </p>
                        </div>

                        <div>
                            <span>✓</span>
                            <strong>Employee Name</strong>
                            <p>
                                Cannot be null or empty.
                            </p>
                        </div>

                        <div>
                            <span>✓</span>
                            <strong>Department</strong>
                            <p>
                                Cannot be null or empty.
                            </p>
                        </div>

                        <div>
                            <span>✓</span>
                            <strong>Start Date</strong>
                            <p>
                                Must follow yyyy-MM-dd format.
                            </p>
                        </div>

                        <div>
                            <span>✓</span>
                            <strong>End Date</strong>
                            <p>
                                Must contain a valid date when provided.
                            </p>
                        </div>

                        <div>
                            <span>✓</span>
                            <strong>Date Relationship</strong>
                            <p>
                                End date cannot occur before start date.
                            </p>
                        </div>

                    </div>

                </section>


                {/* =================================================
                    05 — FAULT TOLERANCE
                ================================================= */}

                <section className="doc-section">

                    <span className="doc-number">
                        05 — FAULT TOLERANCE
                    </span>

                    <h3>
                        What happens when a record is invalid?
                    </h3>

                    <p>
                        A major objective of this prototype is to
                        demonstrate that one bad record should not
                        necessarily stop the entire batch.
                    </p>

                    <div className="fault-box">

                        <div className="fault-item">

                            <span className="fault-icon">
                                !
                            </span>

                            <div>

                                <strong>
                                    Invalid record detected
                                </strong>

                                <p>
                                    The processor throws an
                                    <code>
                                        InvalidEmployeeDataException
                                    </code>
                                    when validation fails.
                                </p>

                            </div>

                        </div>


                        <div className="fault-item">

                            <span className="fault-icon">
                                ↳
                            </span>

                            <div>

                                <strong>
                                    Record is skipped
                                </strong>

                                <p>
                                    Spring Batch fault tolerance allows
                                    the processing pipeline to continue
                                    with the remaining records.
                                </p>

                            </div>

                        </div>


                        <div className="fault-item">

                            <span className="fault-icon">
                                ✓
                            </span>

                            <div>

                                <strong>
                                    Error is persisted
                                </strong>

                                <p>
                                    Error details are stored separately
                                    and associated with the batch execution.
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    06 — CHUNK PROCESSING
                ================================================= */}

                <section className="doc-section">

                    <span className="doc-number">
                        06 — CHUNK PROCESSING
                    </span>

                    <h3>
                        Why Spring Batch?
                    </h3>

                    <p>
                        The step is configured using chunk-oriented
                        processing. In this prototype, records are
                        processed in chunks of five.
                    </p>

                    <div className="metric-row">

                        <div className="metric-card">

                            <strong>
                                5
                            </strong>

                            <span>
                                Records per chunk
                            </span>

                        </div>


                        <div className="metric-card">

                            <strong>
                                ✓
                            </strong>

                            <span>
                                Transaction management
                            </span>

                        </div>


                        <div className="metric-card">

                            <strong>
                                ↻
                            </strong>

                            <span>
                                Fault tolerance
                            </span>

                        </div>


                        <div className="metric-card">

                            <strong>
                                100%
                            </strong>

                            <span>
                                Execution visibility
                            </span>

                        </div>

                    </div>

                    <p className="small-note">
                        Chunk processing allows the application to process
                        records in manageable groups instead of loading and
                        committing the entire dataset as one operation.
                    </p>

                </section>


                {/* =================================================
                    07 — DATABASE
                ================================================= */}

                <section className="doc-section">

                    <span className="doc-number">
                        07 — DATABASE & PERSISTENCE
                    </span>

                    <h3>
                        What is stored?
                    </h3>

                    <div className="database-grid">

                        <div className="database-card">

                            <span className="database-icon">
                                DB
                            </span>

                            <strong>
                                employees
                            </strong>

                            <p>
                                Stores successfully processed employee
                                records, dates and calculated duration.
                            </p>

                        </div>


                        <div className="database-card">

                            <span className="database-icon">
                                ER
                            </span>

                            <strong>
                                batch_error
                            </strong>

                            <p>
                                Stores skipped records, error type,
                                error message and execution ID.
                            </p>

                        </div>


                        <div className="database-card">

                            <span className="database-icon">
                                EX
                            </span>

                            <strong>
                                Spring Batch Metadata
                            </strong>

                            <p>
                                Stores job executions, step executions,
                                status, read/write counts and transactions.
                            </p>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    08 — REST API
                ================================================= */}

                <section className="doc-section">

                    <span className="doc-number">
                        08 — REST API LAYER
                    </span>

                    <h3>
                        Backend APIs exposed by the application
                    </h3>

                    <div className="api-list">

                        <div className="api-row">
                            <span className="method post">
                                POST
                            </span>

                            <code>
                                /api/batch/run
                            </code>

                            <p>
                                Starts a new batch execution.
                            </p>
                        </div>


                        <div className="api-row">
                            <span className="method get">
                                GET
                            </span>

                            <code>
                                /api/batch/executions
                            </code>

                            <p>
                                Returns batch execution history.
                            </p>
                        </div>


                        <div className="api-row">
                            <span className="method get">
                                GET
                            </span>

                            <code>
                                /api/batch/status/{"{executionId}"}
                            </code>

                            <p>
                                Returns execution and step statistics.
                            </p>
                        </div>


                        <div className="api-row">
                            <span className="method get">
                                GET
                            </span>

                            <code>
                                /api/batch/executions/{"{executionId}"}
                            </code>

                            <p>
                                Returns detailed execution information.
                            </p>
                        </div>


                        <div className="api-row">
                            <span className="method get">
                                GET
                            </span>

                            <code>
                                /api/batch/executions/{"{executionId}"}/summary
                            </code>

                            <p>
                                Returns processing summary and success rate.
                            </p>
                        </div>


                        <div className="api-row">
                            <span className="method get">
                                GET
                            </span>

                            <code>
                                /api/batch/executions/{"{executionId}"}/errors
                            </code>

                            <p>
                                Returns errors captured during processing.
                            </p>
                        </div>


                        <div className="api-row">
                            <span className="method get">
                                GET
                            </span>

                            <code>
                                /api/employees
                            </code>

                            <p>
                                Returns successfully processed employees.
                            </p>
                        </div>

                    </div>

                </section>


                {/* =================================================
                    09 — TECHNOLOGY STACK
                ================================================= */}

                <section className="doc-section">

                    <span className="doc-number">
                        09 — TECHNOLOGY STACK
                    </span>

                    <h3>
                        Technologies used
                    </h3>

                    <div className="tech-stack">

                        <div className="tech-row">

                            <div className="tech-name">
                                Java
                            </div>

                            <div className="tech-description">
                                Core application language and business logic.
                            </div>

                        </div>


                        <div className="tech-row">

                            <div className="tech-name">
                                Spring Boot
                            </div>

                            <div className="tech-description">
                                Application framework and REST API layer.
                            </div>

                        </div>


                        <div className="tech-row">

                            <div className="tech-name">
                                Spring Batch
                            </div>

                            <div className="tech-description">
                                Batch execution, chunk processing and fault tolerance.
                            </div>

                        </div>


                        <div className="tech-row">

                            <div className="tech-name">
                                PostgreSQL
                            </div>

                            <div className="tech-description">
                                Persistent storage for employee and error data.
                            </div>

                        </div>


                        <div className="tech-row">

                            <div className="tech-name">
                                JDBC
                            </div>

                            <div className="tech-description">
                                Database interaction and custom reporting queries.
                            </div>

                        </div>


                        <div className="tech-row">

                            <div className="tech-name">
                                REST API
                            </div>

                            <div className="tech-description">
                                Communication layer between backend and dashboard.
                            </div>

                        </div>


                        <div className="tech-row">

                            <div className="tech-name">
                                React
                            </div>

                            <div className="tech-description">
                                Frontend monitoring dashboard and data visualization.
                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    10 — BENEFITS
                ================================================= */}

                <section className="doc-section">

                    <span className="doc-number">
                        10 — BENEFITS
                    </span>

                    <h3>
                        Why use a batch-processing approach?
                    </h3>

                    <div className="benefit-grid">

                        <div className="benefit-card">
                            <span>01</span>
                            <strong>Time Saving</strong>
                            <p>
                                Automates repetitive record-processing
                                work instead of relying on manual handling.
                            </p>
                        </div>

                        <div className="benefit-card">
                            <span>02</span>
                            <strong>Scalability</strong>
                            <p>
                                Designed to process large datasets in
                                manageable chunks.
                            </p>
                        </div>

                        <div className="benefit-card">
                            <span>03</span>
                            <strong>Fault Tolerance</strong>
                            <p>
                                Invalid records can be skipped without
                                unnecessarily stopping the entire process.
                            </p>
                        </div>

                        <div className="benefit-card">
                            <span>04</span>
                            <strong>Traceability</strong>
                            <p>
                                Every execution has identifiable status,
                                counts and error information.
                            </p>
                        </div>

                        <div className="benefit-card">
                            <span>05</span>
                            <strong>Data Quality</strong>
                            <p>
                                Validation prevents invalid employee
                                records from reaching the main table.
                            </p>
                        </div>

                        <div className="benefit-card">
                            <span>06</span>
                            <strong>Observability</strong>
                            <p>
                                The dashboard provides a centralized view
                                of processing health and execution history.
                            </p>
                        </div>

                    </div>

                </section>


                {/* =================================================
                    11 — PROTOTYPE PURPOSE
                ================================================= */}

                <section className="doc-section final-section">

                    <span className="doc-number">
                        11 — PROTOTYPE PURPOSE
                    </span>

                    <h3>
                        What does this prototype demonstrate?
                    </h3>

                    <p>
                        This project is primarily a demonstration of how
                        a traditional data-processing workflow can be
                        transformed into an automated, fault-tolerant
                        and observable batch-processing system.
                    </p>

                    <p>
                        Rather than simply inserting employee records
                        into a database, the prototype demonstrates an
                        end-to-end processing pipeline involving:
                    </p>

                    <div className="prototype-points">

                        <span>CSV ingestion</span>
                        <span>Data validation</span>
                        <span>Business calculations</span>
                        <span>Chunk processing</span>
                        <span>Fault tolerance</span>
                        <span>Error persistence</span>
                        <span>Transaction handling</span>
                        <span>Database upsert</span>
                        <span>Execution tracking</span>
                        <span>REST APIs</span>
                        <span>Monitoring dashboard</span>

                    </div>

                </section>

            </div>


            {/* =====================================================
                FOOTER
            ====================================================== */}

            <div className="modal-footer">

                <span>
                    Employee Batch Processing
                    &nbsp; • &nbsp;
                    Spring Boot
                    &nbsp; • &nbsp;
                    Spring Batch
                    &nbsp; • &nbsp;
                    PostgreSQL
                </span>

                <button
                    className="modal-done-btn"
                    onClick={() => setShowAbout(false)}
                >
                    Close Documentation
                </button>

            </div>

        </div>

    </div>
)}


        </div>
    );

    
}


export default App;