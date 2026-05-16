import yup, { Schema } from "yup"


export const userSchema = yup.object({
    username: yup
        .string()
        .trim()
        .min(6, 'Username must be atleast of 6 characters')
        .required(),
    email: yup
        .string()
        .email('The email is not valid one')
        .required(),
    password: yup
        .string()
        .min(6, 'Password must br atleast 6 charaters')
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