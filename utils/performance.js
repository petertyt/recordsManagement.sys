const fs = require("fs");
const path = require("path");

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      memoryUsage: [],
      responseTimes: [],
      errors: [],
      activeConnections: 0,
    };
    this.startTime = Date.now();
    this.logFile = path.join(__dirname, "../logs/performance.log");
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  logMetric(type, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      data,
    };

    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + "\n");
  }

  trackMemoryUsage() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: usage.rss,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
    });

    // Keep only last 100 entries
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }

    this.logMetric("memory", usage);
    return usage;
  }

  trackResponseTime(req, res, next) {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      this.metrics.responseTimes.push({
        timestamp: Date.now(),
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
      });

      // Keep only last 100 entries
      if (this.metrics.responseTimes.length > 100) {
        this.metrics.responseTimes.shift();
      }

      this.logMetric("response", {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
      });
    });

    next();
  }

  trackError(error, req) {
    this.metrics.errors.push({
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      url: req?.url,
      method: req?.method,
    });

    // Keep only last 50 entries
    if (this.metrics.errors.length > 50) {
      this.metrics.errors.shift();
    }

    this.logMetric("error", {
      message: error.message,
      url: req?.url,
      method: req?.method,
    });
  }

  getPerformanceStats() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime =
      this.metrics.responseTimes.length > 0
        ? this.metrics.responseTimes.reduce((sum, rt) => sum + rt.duration, 0) /
          this.metrics.responseTimes.length
        : 0;

    const errorRate =
      this.metrics.responseTimes.length > 0
        ? (this.metrics.errors.length / this.metrics.responseTimes.length) * 100
        : 0;

    const currentMemory = this.trackMemoryUsage();

    return {
      uptime,
      avgResponseTime,
      errorRate,
      totalRequests: this.metrics.responseTimes.length,
      totalErrors: this.metrics.errors.length,
      memoryUsage: currentMemory,
      activeConnections: this.metrics.activeConnections,
    };
  }

  getMemoryLeakDetection() {
    if (this.metrics.memoryUsage.length < 10) return null;

    const recent = this.metrics.memoryUsage.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];

    const growthRate =
      (last.heapUsed - first.heapUsed) / (last.timestamp - first.timestamp);

    return {
      growthRate,
      isLeaking: growthRate > 1000, // 1KB per second threshold
      totalGrowth: last.heapUsed - first.heapUsed,
    };
  }

  // Express middleware
  middleware() {
    return (req, res, next) => {
      this.metrics.activeConnections++;
      this.trackResponseTime(req, res, () => {
        this.metrics.activeConnections--;
        next();
      });
    };
  }
}

module.exports = PerformanceMonitor;
