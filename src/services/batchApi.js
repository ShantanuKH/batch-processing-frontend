import axios from "axios";

const API = axios.create({
    baseURL: "https://batchprocessing-using-springboot.onrender.com/api/",
});

export const startBatch = () => {
    return API.post("/batch/run");
};

export const getExecutions = () => {
    return API.get("/batch/executions");
};

export const getSummary = (executionId) => {
    return API.get(`/batch/executions/${executionId}/summary`);
};

export const getErrors = (executionId) => {
    return API.get(`/batch/executions/${executionId}/errors`);
};

export const getEmployees = () => {
    return API.get("/employees");
};