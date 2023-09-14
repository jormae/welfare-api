const express = require("express");
const cors = require("cors");
const res = require("express/lib/response");
const authRouter = require("./routes/auth");
const allowancesRouter = require("./routes/allowances");
const dashboardRouter = require("./routes/dashboard");
const debtRouter = require("./routes/debts");
const goldsRouter = require("./routes/golds");
const membersRouter = require("./routes/members");
const spousesRouter = require("./routes/spouses");
const investmentsRouter = require("./routes/investments");
const loansRouter = require("./routes/loans");
const dividendsRouter = require("./routes/dividends");
const paymentsRouter = require("./routes/payments");
const reportsRouter = require("./routes/reports");
const uploadsRouter = require("./routes/uploads");
const utilsRouter = require("./routes/utils");
const zakatsRouter = require("./routes/zakats");

const app = express();
app.use(cors());
app.use(express.json());

// app.use(express.static('/images'))
app.use('/files/payment-slip', express.static('uploads/payment-slip'))
app.get("/", (req, res) => res.send("Welcome to my js api."));
app.use("/auth", authRouter);
app.use("/allowances", allowancesRouter);
app.use("/dashboard", dashboardRouter);
app.use("/debts", debtRouter);
app.use("/golds", goldsRouter);
app.use("/members", membersRouter);
app.use("/spouses", spousesRouter);
app.use("/investments", investmentsRouter);
app.use("/loans", loansRouter);
app.use("/dividends", dividendsRouter);
app.use("/payments", paymentsRouter);
app.use("/reports", reportsRouter);
app.use("/uploads", uploadsRouter);
app.use("/utils", utilsRouter);
app.use("/zakats", zakatsRouter);

app.listen(3030, () => console.log("Server is running on port 3030"));
