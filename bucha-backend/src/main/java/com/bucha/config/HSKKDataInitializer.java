package com.bucha.config;

import com.bucha.entity.HSKKQuestion;
import com.bucha.repository.HSKKQuestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.List;

/**
 * Seeds HSKK Basic exam questions if the table is empty.
 */
@Configuration
@Order(100)
public class HSKKDataInitializer implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(HSKKDataInitializer.class);

    private final HSKKQuestionRepository questionRepository;

    public HSKKDataInitializer(HSKKQuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (questionRepository.count() > 0) {
            return;
        }
        logger.info("Seeding HSKK Basic exam questions...");

        // Part 1: Repeat sentence (15 questions)
        List<String> part1Texts = List.of(
                "商店里的人不多",
                "她中午做了很多菜",
                "那本书在桌子上",
                "我们坐飞机去北京",
                "他们都认识我",
                "今年是二零一零年",
                "我学会开车了",
                "这儿的衣服很便宜",
                "王老师，明天见",
                "有问题可以找我",
                "这个西瓜十四斤",
                "今天比昨天热",
                "我在教室等你",
                "走路的时候不要看书",
                "谢谢你告诉我这件事"
        );
        for (int i = 0; i < part1Texts.size(); i++) {
            HSKKQuestion q = new HSKKQuestion();
            q.setText(part1Texts.get(i));
            q.setPart(1);
            q.setQuestionOrder(i + 1);
            q.setAudioUrl(null); // Can be set later if you have audio URLs
            questionRepository.save(q);
        }

        // Part 2: Short answer (10 questions)
        List<String> part2Texts = List.of(
                "一年有多少天",
                "猫和狗你喜欢哪个",
                "我工作了你呢",
                "你爱读书吗",
                "明天会不会下雨",
                "你觉得你的汉语怎么样",
                "你的手机是什么颜色",
                "你每天几点起床",
                "你买汽车了",
                "你们家谁最高"
        );
        for (int i = 0; i < part2Texts.size(); i++) {
            HSKKQuestion q = new HSKKQuestion();
            q.setText(part2Texts.get(i));
            q.setPart(2);
            q.setQuestionOrder(i + 1);
            q.setAudioUrl(null);
            questionRepository.save(q);
        }

        // Part 3: Open speaking (2 questions)
        List<String> part3Texts = List.of(
                "你喜欢看报纸吗为什么",
                "请介绍一个对你帮助很大的人"
        );
        for (int i = 0; i < part3Texts.size(); i++) {
            HSKKQuestion q = new HSKKQuestion();
            q.setText(part3Texts.get(i));
            q.setPart(3);
            q.setQuestionOrder(i + 1);
            q.setAudioUrl(null);
            questionRepository.save(q);
        }

        logger.info("HSKK questions seeded: {} total", questionRepository.count());
    }
}
