module.exports = {
    checkAuth: function (req, res, next) {
        if (!req.user) return res.sendStatus(401); // 'Not authorized'
        next();  // пропускати далі тільки аутентифікованих
    },
    checkAdmin: function (req, res, next) {
        if (!req.user) res.sendStatus(401); // 'Not authorized'
        else if (req.user.role) res.sendStatus(403); // 'Forbidden'
        else next();  // пропускати далі тільки аутентифікованих із роллю 'admin'
    },
    checkAdminRights: function(user) {
        return user && !user.role;
    }
};