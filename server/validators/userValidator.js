const { z } = require('zod');

// Schema for User Registration POST payload
const userRegistrationSchema = z.object({
    name: z.string({
        required_error: "Name is required",
        invalid_type_error: "Name must be a string",
    }).min(2, "Name must be at least 2 characters long"),
    
    email: z.string({
        required_error: "Email is required",
    }).email("Invalid email address format"),
    
    password: z.string({
        required_error: "Password is required",
    }).min(6, "Password must be at least 6 characters long"),
    
    phone: z.string({
        required_error: "Phone number is required",
    }).min(10, "Phone number must be at least 10 characters long"),
    
    role: z.enum(['user', 'mechanic'], {
        errorMap: () => ({ message: "Role must be either 'user' or 'mechanic'" })
    }).default('user'),
});

// Schema for User Login POST payload
const userLoginSchema = z.object({
    email: z.string({
        required_error: "Email is required",
    }).email("Invalid email address format"),
    
    password: z.string({
        required_error: "Password is required",
    }).min(1, "Password cannot be empty"),
});

module.exports = {
    userRegistrationSchema,
    userLoginSchema
};
