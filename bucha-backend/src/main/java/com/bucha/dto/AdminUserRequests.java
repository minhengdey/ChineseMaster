package com.bucha.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminUserRequests {

    public record Create(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự") String password,
            @NotBlank String name,
            @NotBlank String role) {
    }

    public record Update(
            @NotBlank String name,
            @Email String email,
            @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự") String password,
            String role) {
    }

    public record RoleUpdate(@NotBlank String role) {
    }
}
