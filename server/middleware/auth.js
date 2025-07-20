// import { clerkClient } from "@clerk/express";

// export const protectAdmin = async (req, res, next) => {
//     try {

//     const { userId } = req.auth();

//      if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized: No userId" });
//     }


//     const user = await clerkClient.users.getUser(userId)

//     if(user.privateMetadata.role !== 'admin') {
//         return res.json({success: false, message: "not authorized"})
//     }

//     req.user = { isAdmin: true }; 
//     next();

//     }catch(error)
//     {
//         return res.json({success: false, message: "not authorized"})
//     }
// }

import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    if (!userId) {
      console.warn("Unauthorized: No userId from Clerk");
      return res.status(401).json({ success: false, message: "Unauthorized: No userId" });
    }

    const user = await clerkClient.users.getUser(userId);

    if (!user || !user.privateMetadata || user.privateMetadata.role !== 'admin') {
      console.warn("Access denied: User is not admin", {
        email: user?.emailAddresses?.[0]?.emailAddress,
        role: user?.privateMetadata?.role
      });

      return res.status(403).json({ success: false, message: "Forbidden: Not authorized as admin" });
    }

    // Attach user info if needed
    req.user = {
      isAdmin: true,
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress
    };

    next();
  } catch (error) {
    console.error("Error in protectAdmin middleware:", error);
    return res.status(500).json({ success: false, message: "Server Error in protectAdmin" });
  }
};
