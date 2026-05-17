import yup from "yup"


export const userSchema = yup.object({
    username: yup
        .string()
        .trim()
        .min(2, 'Username must be at least 2 characters')
        .required(),
    email: yup
        .string()
        .trim()
        .lowercase()
        .email('The email is not valid one')
        .required(),
    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .required()
})

export const validateUser = (schema) => async (req, res, next) => {
    try {
        await schema.validate(req.body)
        next()
    } catch (err) {
        return res.status(400).json({
            errors:err.errors
        })
    }
}
