package com.bucha.service;

import com.bucha.entity.ClassEntity;
import com.bucha.entity.ClassMembership;
import com.bucha.entity.UserEntity;
import com.bucha.repository.ClassMembershipRepository;
import com.bucha.repository.ClassRepository;
import com.bucha.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClassService {
    private static final Logger log = LoggerFactory.getLogger(ClassService.class);

    private final ClassRepository classRepository;
    private final ClassMembershipRepository membershipRepository;
    private final UserRepository userRepository;

    public ClassService(ClassRepository classRepository, ClassMembershipRepository membershipRepository,
            UserRepository userRepository) {
        this.classRepository = classRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }

    public ClassEntity createClass(String name, String description) {
        ClassEntity c = new ClassEntity();
        c.setName(name);
        c.setDescription(description);
        return classRepository.save(c);
    }

    public List<ClassEntity> listClasses() {
        return classRepository.findAll();
    }

    public Optional<ClassEntity> findById(Long id) {
        return classRepository.findById(id);
    }

    public boolean addUserToClass(Long classId, Long userId) {
        var optC = classRepository.findById(classId);
        var optU = userRepository.findById(userId);
        if (optC.isEmpty() || optU.isEmpty())
            return false;
        if (membershipRepository.findByClassEntity_IdAndUser_Id(classId, userId).isPresent())
            return false;
        ClassMembership m = new ClassMembership();
        m.setClassEntity(optC.get());
        m.setUser(optU.get());
        membershipRepository.save(m);
        return true;
    }

    public boolean removeUserFromClass(Long classId, Long userId) {
        var opt = membershipRepository.findByClassEntity_IdAndUser_Id(classId, userId);
        if (opt.isEmpty())
            return false;
        membershipRepository.delete(opt.get());
        return true;
    }

    public List<ClassMembership> getMembers(Long classId) {
        return membershipRepository.findByClassEntity_Id(classId);
    }
}
