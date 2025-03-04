

const sessions = {}; 
exports.generateCaptcha = (req, res) => {
    
};


exports.login = (req, res) => {
    const { email, password } = req.body;

   
    res.json({ success: true, message: 'Login exitoso' });
};
