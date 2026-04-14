const validate = (schema) => async (req, res, next) => {
    try {
        // Parse the incoming request body against the provided Zod schema
        const parsedBody = await schema.parseAsync(req.body);
        
        // Replace the req.body with the sanitized/parsed data from Zod
        // This strips out any unexpected/malicious extra fields entirely!
        req.body = parsedBody;
        
        // Move to the next Express middleware/route handler
        next();
    } catch (error) {
        // If Zod validation fails, map the errors into a readable JSON format
        if (error.name === 'ZodError') {
            const formattedErrors = error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: formattedErrors 
            });
        }
        
        // Generic 500 fallback just in case
        return res.status(500).json({ error: 'Internal Server Error during validation' });
    }
};

module.exports = validate;
