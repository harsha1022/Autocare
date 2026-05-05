/**
 * Role-based authorization middleware factory.
 * Usage: router.get('/route', authMiddleware, requireRole('admin'), handler)
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized — no user in request' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Forbidden — requires role: ${roles.join(' or ')}, you have: ${req.user.role}` 
            });
        }
        next();
    };
};

module.exports = requireRole;
