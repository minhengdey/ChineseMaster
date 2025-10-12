import React, { useState } from "react";
import { authAPI, handleApiError } from "../../../services/api";

const LoginForm = ({ onLogin }) => {
   const [formData, setFormData] = useState({
      email: "",
      password: "",
   });
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

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

      try {
         const result = await authAPI.login(formData);
         if (result.user) {
            onLogin(result.user);
         }
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

         <div className="form-control">
            <label className="label">
               <span className="label-text">Tên đăng nhập</span>
            </label>
            <input
               type="text"
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
            <label className="label">
               <a href="#" className="label-text-alt link link-hover">
                  Quên mật khẩu?
               </a>
            </label>
         </div>

         <div className="form-control mt-6">
            <button
               type="submit"
               className={`btn btn-primary ${loading ? "loading" : ""}`}
               disabled={loading}
            >
               {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
         </div>
      </form>
   );
};

export default LoginForm;
