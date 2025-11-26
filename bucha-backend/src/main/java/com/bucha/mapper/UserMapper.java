package com.bucha.mapper;

import com.bucha.dto.request.RegisterRequest;
import com.bucha.dto.response.UserResponse;
import com.bucha.dto.response.LoginUserInfoResponse;
import com.bucha.dto.response.UserProfileResponse;
import com.bucha.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {
    User toEntity(RegisterRequest req);

    @Mapping(target = "iseScores", ignore = true)
    @Mapping(target = "userLessons", ignore = true)
    UserResponse toResponse(User user);

    LoginUserInfoResponse toLoginInfo(User user);

    UserProfileResponse toProfile(User user);
}
