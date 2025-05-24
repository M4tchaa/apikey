module.exports = function (req, res, next) {
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Akses hanya untuk admin" });
  }
  next();
};
