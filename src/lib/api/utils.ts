import { NextApiRequest, NextApiResponse } from "next"

export function getQueryParam(
  paramName: string,
  req: NextApiRequest,
  res: NextApiResponse
): string | never {
  const param = req.query[paramName]
  if (!param || typeof param !== "string") {
    return res
      .status(400)
      .json({ message: `${paramName} must be a non-empty string` }) as never
  }
  return param
}
