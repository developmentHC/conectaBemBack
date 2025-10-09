if (["development", "staging"].includes(process.env.NODE_ENV)) {
  console.log("🧪 Rotas de desenvolvimento habilitadas");
  import("./dev/routes/testOtpRoutes.mjs").then(({ default: testOtpRoutes }) => {
    app.use("/auth/otp", testOtpRoutes);
  });
}
