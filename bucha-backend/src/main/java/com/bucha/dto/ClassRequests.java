package com.bucha.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTOs for Class operations
 */
public class ClassRequests {

    /**
     * Request to create a new class
     */
    public record CreateClassRequest(
            @NotBlank(message = "Tên lớp không được để trống") @Size(min = 3, max = 100, message = "Tên lớp phải có từ 3-100 ký tự") String name,

            @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự") String description) {
    }

    /**
     * Request to update an existing class
     */
    public record UpdateClassRequest(
            @Size(min = 3, max = 100, message = "Tên lớp phải có từ 3-100 ký tự") String name,

            @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự") String description) {
    }

    /**
     * Request to add a member to a class
     */
    public record AddMemberRequest(
            @NotNull(message = "ID người dùng không được để trống") Long userId) {
    }

    /**
     * Request to add multiple members to a class
     */
    public record AddMultipleMembersRequest(
            @NotNull(message = "Danh sách ID người dùng không được để trống") @Size(min = 1, message = "Phải có ít nhất 1 người dùng") Long[] userIds) {
    }
}
