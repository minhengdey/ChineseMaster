import React, { useState } from "react";
import { authAPI, handleApiError } from "../../../services/api";

const RegisterForm = ({ onRegister }) => {
   const [formData, setFormData] = useState({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
   });
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const [success, setSuccess] = useState("");

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
         ...prev,
         [name]: value,
      }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      setSuccess("");

      if (formData.password !== formData.confirmPassword) {
         setError("Mật khẩu xác nhận không khớp");
         setLoading(false);
         return;
      }

      try {
         await authAPI.register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
         });

         setSuccess("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
         setTimeout(() => {
            onRegister();
         }, 2000);
      } catch (error) {
         setError(handleApiError(error));
      } finally {
         setLoading(false);
      }
   };

   return (
      <form onSubmit={handleSubmit} className="space-y-4">
         {error && (
            <div className="alert alert-error">
               <span>{error}</span>
            </div>
         )}

         {success && (
            <div className="alert alert-success">
               <span>{success}</span>
            </div>
         )}

         <div className="form-control">
            <label className="label">
               <span className="label-text">Tên đăng nhập</span>
            </label>
            <input
               type="text"
               name="username"
               value={formData.username}
               onChange={handleChange}
               className="input input-bordered"
               placeholder="Nhập tên đăng nhập"
               required
            />
         </div>

         <div className="form-control">
            <label className="label">
               <span className="label-text">Email</span>
            </label>
            <input
               type="email"
               name="email"
               value={formData.email}
               onChange={handleChange}
               className="input input-bordered"
               placeholder="Nhập email"
               required
            />
         </div>

         <div className="form-control">
            <label className="label">
               <span className="label-text">Mật khẩu</span>
            </label>
            <input
               type="password"
               name="password"
               value={formData.password}
               onChange={handleChange}
               className="input input-bordered"
               placeholder="Nhập mật khẩu"
               required
            />
         </div>

         <div className="form-control">
            <label className="label">
               <span className="label-text">Xác nhận mật khẩu</span>
            </label>
            <input
               type="password"
               name="confirmPassword"
               value={formData.confirmPassword}
               onChange={handleChange}
               className="input input-bordered"
               placeholder="Nhập lại mật khẩu"
               required
            />
         </div>

         <div className="form-control mt-6">
            <button
               type="submit"
               className={`btn btn-primary ${loading ? "loading" : ""}`}
               disabled={loading}
            >
               {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
         </div>
      </form>
   );
};

export default RegisterForm;
