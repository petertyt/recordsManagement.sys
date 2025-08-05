function setUser(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role) {
    req.user = { role };
  }
  next();
}

function authorize(allowed = []) {
  return function (req, res, next) {
    const userRole = req.user && req.user.role;
    if (!userRole || !allowed.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { setUser, authorize };
