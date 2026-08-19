# Employee Batch Processing — Monitoring Dashboard

A modern React-based monitoring dashboard for a Spring Boot + Spring Batch application.

The dashboard provides a visual interface to execute batch jobs, monitor executions, inspect processing statistics, view processed employee records, and investigate errors captured during batch processing.

---

## 🚀 Live Demo

> **Want to understand what this application actually does?**

Visit the live application and click **"About Application"** in the hero section.

The About Application section provides a complete overview of:

- Why the application was created
- What problem it solves
- How the batch-processing pipeline works
- How employee records are validated
- How invalid records are handled
- How errors are persisted
- How batch executions are monitored
- Backend architecture
- REST APIs
- Technology stack
- Prototype purpose
- Benefits of batch processing

### 🌐 Demo

**[Open Employee Batch Processing Dashboard](https://batch-processing-frontend.onrender.com/)**

> `https://batch-processing-frontend.onrender.com/`

---

# 📌 Project Overview

Employee and business data is often processed in large volumes.

Processing every record manually or through a simple sequential database operation can become inefficient, difficult to monitor, and difficult to recover from when individual records contain invalid data.

This project demonstrates how such a workflow can be transformed into a:

- Automated
- Chunk-based
- Fault-tolerant
- Observable
- Database-backed
- API-driven

**batch-processing system.**

The backend uses **Spring Batch** to process employee records while the React frontend provides a monitoring dashboard for the complete execution lifecycle.

---

# 🎯 Why Was This Application Created?

The primary objective of this project is to demonstrate how a traditional data-processing workflow can be converted into an automated and fault-tolerant batch-processing architecture.

Instead of simply inserting employee records into a database, the application demonstrates an end-to-end processing pipeline:

```text
CSV Input
   ↓
Read Records
   ↓
Validate Data
   ↓
Process Records
   ↓
Calculate Employee Duration
   ↓
Write Valid Records
   ↓
Handle Invalid Records
   ↓
Persist Error Information
   ↓
Track Batch Execution
   ↓
Expose REST APIs
   ↓
React Monitoring Dashboard
