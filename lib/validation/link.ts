import { z } from "zod"

export const CreateLinkSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, "Title must be 200 characters or fewer")
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : v)),
  dest_url: z.string().url("Please provide a valid URL"),
  ads_required: z.coerce.number().int().min(1).max(5).default(3),
})

export type CreateLinkInput = z.infer<typeof CreateLinkSchema>
