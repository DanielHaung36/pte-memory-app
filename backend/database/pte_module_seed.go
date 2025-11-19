package database

import (
	"pte-memory-backend/models"
	"gorm.io/gorm"
)

// SeedPTEModules 初始化PTE模块和题型数据
func SeedPTEModules(db *gorm.DB) error {
	// 检查是否已经初始化
	var count int64
	db.Model(&models.PTEModule{}).Count(&count)
	if count > 0 {
		return nil // 已经初始化过了
	}

	// 1. Speaking Module (口语模块)
	speakingModule := models.PTEModule{
		Code:        "speaking",
		Name:        "Speaking",
		NameCN:      "口语",
		Description: "PTE Speaking section tests your ability to speak English in academic settings.",
		Color:       "#3B82F6", // 蓝色
		SortOrder:   1,
		IsActive:    true,
	}
	if err := db.Create(&speakingModule).Error; err != nil {
		return err
	}

	speakingTypes := []models.PTEQuestionType{
		{
			ModuleID:         speakingModule.ID,
			Code:             "read_aloud",
			Name:             "Read Aloud",
			NameCN:           "朗读",
			Description:      "You will see a text on screen. You have 30-40 seconds to prepare. You will then hear a short tone. After the tone, start reading the text aloud into the microphone.",
			ScoringInfo:      "Scores reading and speaking skills. Content, oral fluency, and pronunciation are assessed.",
			TimeLimit:        40,
			QuestionCount:    6,
			ScoreWeight:      "Reading & Speaking",
			SkillsTested:     models.StringArray{"Content", "Oral Fluency", "Pronunciation"},
			Tips: models.StringArray{
				"在准备时间内快速浏览全文",
				"注意单词的正确发音和重读",
				"保持流畅，不要停顿太久",
				"语速适中，发音清晰",
			},
			CommonMistakes: models.StringArray{
				"发音不准确",
				"语速过快或过慢",
				"停顿过多",
				"忽略标点符号",
			},
			Color:     "#3B82F6",
			SortOrder: 1,
			IsActive:  true,
		},
		{
			ModuleID:         speakingModule.ID,
			Code:             "repeat_sentence",
			Name:             "Repeat Sentence",
			NameCN:           "复述句子",
			Description:      "You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the sentence only once.",
			ScoringInfo:      "Scores listening and speaking skills. Content, oral fluency, and pronunciation are assessed.",
			TimeLimit:        15,
			QuestionCount:    10,
			ScoreWeight:      "Listening & Speaking",
			SkillsTested:     models.StringArray{"Content", "Oral Fluency", "Pronunciation"},
			Tips: models.StringArray{
				"集中注意力听完整个句子",
				"记住句子的关键词和结构",
				"尽可能准确地重复每个单词",
				"保持流畅和自然的语调",
			},
			CommonMistakes: models.StringArray{
				"漏词或添加词",
				"改变句子结构",
				"发音不清晰",
				"语速不自然",
			},
			Color:     "#3B82F6",
			SortOrder: 2,
			IsActive:  true,
		},
		{
			ModuleID:         speakingModule.ID,
			Code:             "describe_image",
			Name:             "Describe Image",
			NameCN:           "描述图像",
			Description:      "Look at the image below. In 25 seconds, please speak into the microphone and describe in detail what the image is showing. You will have 40 seconds to give your response.",
			ScoringInfo:      "Scores speaking skills. Content, oral fluency, and pronunciation are assessed.",
			TimeLimit:        65,
			QuestionCount:    3,
			ScoreWeight:      "Speaking",
			SkillsTested:     models.StringArray{"Content", "Oral Fluency", "Pronunciation"},
			Tips: models.StringArray{
				"使用通用模板：introduction - main trends - conclusion",
				"描述图表的标题、轴标签和主要数据",
				"使用比较和对比的语言",
				"确保流畅和连贯",
			},
			CommonMistakes: models.StringArray{
				"描述过于简单",
				"没有逻辑结构",
				"流畅度不够",
				"时间分配不当",
			},
			Color:     "#3B82F6",
			SortOrder: 3,
			IsActive:  true,
		},
		{
			ModuleID:         speakingModule.ID,
			Code:             "retell_lecture",
			Name:             "Retell Lecture",
			NameCN:           "复述讲座",
			Description:      "You will hear a lecture. After listening to the lecture, in 10 seconds, please speak into the microphone and retell what you have just heard in your own words. You will have 40 seconds to give your response.",
			ScoringInfo:      "Scores listening and speaking skills. Content, oral fluency, and pronunciation are assessed.",
			TimeLimit:        90,
			QuestionCount:    1,
			ScoreWeight:      "Listening & Speaking",
			SkillsTested:     models.StringArray{"Content", "Oral Fluency", "Pronunciation"},
			Tips: models.StringArray{
				"做好笔记，记录关键词和要点",
				"使用自己的话重述内容",
				"遵循讲座的逻辑顺序",
				"保持流畅和连贯",
			},
			CommonMistakes: models.StringArray{
				"笔记不完整",
				"遗漏重要信息",
				"逻辑混乱",
				"过度依赖笔记",
			},
			Color:     "#3B82F6",
			SortOrder: 4,
			IsActive:  true,
		},
		{
			ModuleID:         speakingModule.ID,
			Code:             "answer_short_question",
			Name:             "Answer Short Question",
			NameCN:           "简答题",
			Description:      "You will hear a question. Please give a simple and short answer. Often just one or a few words is enough.",
			ScoringInfo:      "Scores listening and speaking skills. Only content is assessed.",
			TimeLimit:        10,
			QuestionCount:    5,
			ScoreWeight:      "Listening & Speaking",
			SkillsTested:     models.StringArray{"Content", "Vocabulary"},
			Tips: models.StringArray{
				"仔细听问题",
				"用简短的答案回答",
				"通常一到两个词就够了",
				"不要过度思考",
			},
			CommonMistakes: models.StringArray{
				"答案过长",
				"没有理解问题",
				"回答不相关",
				"发音问题",
			},
			Color:     "#3B82F6",
			SortOrder: 5,
			IsActive:  true,
		},
	}

	for _, qt := range speakingTypes {
		if err := db.Create(&qt).Error; err != nil {
			return err
		}
	}

	// 2. Writing Module (写作模块)
	writingModule := models.PTEModule{
		Code:        "writing",
		Name:        "Writing",
		NameCN:      "写作",
		Description: "PTE Writing section tests your ability to write in English in academic settings.",
		Color:       "#10B981", // 绿色
		SortOrder:   2,
		IsActive:    true,
	}
	if err := db.Create(&writingModule).Error; err != nil {
		return err
	}

	writingTypes := []models.PTEQuestionType{
		{
			ModuleID:         writingModule.ID,
			Code:             "summarize_written_text",
			Name:             "Summarize Written Text",
			NameCN:           "概括文本",
			Description:      "Read the passage below and summarize it using one sentence. You have 10 minutes to complete this task. Your response will be judged on the quality of your writing and on how well your response presents the key points in the passage.",
			ScoringInfo:      "Scores reading and writing skills. Content, form, grammar, and vocabulary are assessed.",
			TimeLimit:        600,
			QuestionCount:    1,
			ScoreWeight:      "Reading & Writing",
			SkillsTested:     models.StringArray{"Content", "Form", "Grammar", "Vocabulary"},
			Tips: models.StringArray{
				"用一句话概括（5-75词）",
				"包含所有主要观点",
				"使用正确的语法和标点",
				"避免抄袭原文",
			},
			CommonMistakes: models.StringArray{
				"超过或少于字数限制",
				"遗漏关键信息",
				"语法错误",
				"直接抄袭原文",
			},
			Color:     "#10B981",
			SortOrder: 1,
			IsActive:  true,
		},
		{
			ModuleID:         writingModule.ID,
			Code:             "write_essay",
			Name:             "Write Essay",
			NameCN:           "写作文",
			Description:      "You will have 20 minutes to plan, write and revise an essay about the topic below. Your response will be judged on how well you develop a position, organize your ideas, present supporting details, and control the elements of standard written English.",
			ScoringInfo:      "Scores writing skills. Content, form, development, structure, coherence, grammar, vocabulary, and spelling are assessed.",
			TimeLimit:        1200,
			QuestionCount:    1,
			ScoreWeight:      "Writing",
			SkillsTested:     models.StringArray{"Content", "Form", "Grammar", "Vocabulary", "Spelling", "Development", "Structure", "Coherence"},
			Tips: models.StringArray{
				"写200-300词",
				"使用标准的议论文结构：introduction-body-conclusion",
				"每段要有主题句",
				"使用连接词增强连贯性",
				"留时间检查语法和拼写",
			},
			CommonMistakes: models.StringArray{
				"字数不够或过多",
				"结构混乱",
				"论证不充分",
				"语法和拼写错误",
			},
			Color:     "#10B981",
			SortOrder: 2,
			IsActive:  true,
		},
	}

	for _, qt := range writingTypes {
		if err := db.Create(&qt).Error; err != nil {
			return err
		}
	}

	// 3. Reading Module (阅读模块)
	readingModule := models.PTEModule{
		Code:        "reading",
		Name:        "Reading",
		NameCN:      "阅读",
		Description: "PTE Reading section tests your ability to read and understand written English in academic settings.",
		Color:       "#8B5CF6", // 紫色
		SortOrder:   3,
		IsActive:    true,
	}
	if err := db.Create(&readingModule).Error; err != nil {
		return err
	}

	readingTypes := []models.PTEQuestionType{
		{
			ModuleID:         readingModule.ID,
			Code:             "reading_writing_fill_blanks",
			Name:             "Reading & Writing: Fill in the Blanks",
			NameCN:           "阅读写作填空",
			Description:      "In the text below some words are missing. Drag words from the box below to the appropriate place in the text.",
			ScoringInfo:      "Scores reading and writing skills. Each correct word scores 1 point.",
			TimeLimit:        180,
			QuestionCount:    5,
			ScoreWeight:      "Reading & Writing",
			SkillsTested:     models.StringArray{"Reading", "Writing", "Vocabulary", "Grammar"},
			Tips: models.StringArray{
				"先通读全文理解大意",
				"根据语法和上下文选择",
				"注意词性和搭配",
				"最后检查是否通顺",
			},
			CommonMistakes: models.StringArray{
				"忽略上下文",
				"词性错误",
				"固定搭配错误",
				"没有检查",
			},
			Color:     "#8B5CF6",
			SortOrder: 1,
			IsActive:  true,
		},
		{
			ModuleID:         readingModule.ID,
			Code:             "multiple_choice_multiple_answers",
			Name:             "Multiple Choice, Multiple Answers",
			NameCN:           "多选题",
			Description:      "Read the text and answer the question by selecting all the correct responses. More than one response is correct.",
			ScoringInfo:      "Scores reading skills. Partial credit scoring applies.",
			TimeLimit:        120,
			QuestionCount:    2,
			ScoreWeight:      "Reading",
			SkillsTested:     models.StringArray{"Reading Comprehension", "Critical Thinking"},
			Tips: models.StringArray{
				"仔细阅读问题和选项",
				"排除明显错误的选项",
				"在文中找到支持证据",
				"确保选择所有正确答案",
			},
			CommonMistakes: models.StringArray{
				"只选一个答案",
				"选择过多错误选项",
				"没有找到文中证据",
				"理解偏差",
			},
			Color:     "#8B5CF6",
			SortOrder: 2,
			IsActive:  true,
		},
		{
			ModuleID:         readingModule.ID,
			Code:             "reorder_paragraphs",
			Name:             "Re-order Paragraphs",
			NameCN:           "段落排序",
			Description:      "The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.",
			ScoringInfo:      "Scores reading skills. Each correctly ordered adjacent pair scores 1 point.",
			TimeLimit:        180,
			QuestionCount:    2,
			ScoreWeight:      "Reading",
			SkillsTested:     models.StringArray{"Reading", "Logic", "Coherence"},
			Tips: models.StringArray{
				"找出首段（通常包含主题介绍）",
				"注意连接词和代词指代",
				"找出逻辑关系",
				"检查段落间的连贯性",
			},
			CommonMistakes: models.StringArray{
				"忽略连接词",
				"没有找到首段",
				"逻辑关系混乱",
				"没有检查连贯性",
			},
			Color:     "#8B5CF6",
			SortOrder: 3,
			IsActive:  true,
		},
		{
			ModuleID:         readingModule.ID,
			Code:             "reading_fill_blanks",
			Name:             "Reading: Fill in the Blanks",
			NameCN:           "阅读填空",
			Description:      "Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.",
			ScoringInfo:      "Scores reading skills. Each correct word scores 1 point.",
			TimeLimit:        180,
			QuestionCount:    4,
			ScoreWeight:      "Reading",
			SkillsTested:     models.StringArray{"Reading", "Vocabulary", "Collocation"},
			Tips: models.StringArray{
				"根据上下文选择",
				"注意词汇搭配",
				"考虑语义连贯性",
				"排除法缩小选项",
			},
			CommonMistakes: models.StringArray{
				"忽略上下文",
				"固定搭配不熟悉",
				"语义不连贯",
				"词汇量不够",
			},
			Color:     "#8B5CF6",
			SortOrder: 4,
			IsActive:  true,
		},
		{
			ModuleID:         readingModule.ID,
			Code:             "multiple_choice_single_answer",
			Name:             "Multiple Choice, Single Answer",
			NameCN:           "单选题",
			Description:      "Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.",
			ScoringInfo:      "Scores reading skills. 1 point for correct answer, 0 for incorrect.",
			TimeLimit:        90,
			QuestionCount:    2,
			ScoreWeight:      "Reading",
			SkillsTested:     models.StringArray{"Reading Comprehension", "Critical Thinking"},
			Tips: models.StringArray{
				"仔细阅读问题",
				"在文中找到相关信息",
				"排除错误选项",
				"选择最佳答案",
			},
			CommonMistakes: models.StringArray{
				"没有理解问题",
				"过度推断",
				"没有找到文中证据",
				"选择部分正确的答案",
			},
			Color:     "#8B5CF6",
			SortOrder: 5,
			IsActive:  true,
		},
	}

	for _, qt := range readingTypes {
		if err := db.Create(&qt).Error; err != nil {
			return err
		}
	}

	// 4. Listening Module (听力模块)
	listeningModule := models.PTEModule{
		Code:        "listening",
		Name:        "Listening",
		NameCN:      "听力",
		Description: "PTE Listening section tests your ability to understand spoken English in academic settings.",
		Color:       "#F59E0B", // 橙色
		SortOrder:   4,
		IsActive:    true,
	}
	if err := db.Create(&listeningModule).Error; err != nil {
		return err
	}

	listeningTypes := []models.PTEQuestionType{
		{
			ModuleID:         listeningModule.ID,
			Code:             "summarize_spoken_text",
			Name:             "Summarize Spoken Text",
			NameCN:           "概括口语",
			Description:      "You will hear a short lecture. Write a summary for a fellow student who was not present at the lecture. You should write 50-70 words.",
			ScoringInfo:      "Scores listening and writing skills. Content, form, grammar, vocabulary, and spelling are assessed.",
			TimeLimit:        600,
			QuestionCount:    1,
			ScoreWeight:      "Listening & Writing",
			SkillsTested:     models.StringArray{"Listening", "Writing", "Content", "Form", "Grammar", "Vocabulary", "Spelling"},
			Tips: models.StringArray{
				"记笔记记录关键信息",
				"写50-70词",
				"包含主要观点",
				"使用正确的语法和拼写",
			},
			CommonMistakes: models.StringArray{
				"字数不符合要求",
				"遗漏关键信息",
				"语法和拼写错误",
				"笔记不完整",
			},
			Color:     "#F59E0B",
			SortOrder: 1,
			IsActive:  true,
		},
		{
			ModuleID:         listeningModule.ID,
			Code:             "multiple_choice_multiple_answers_listening",
			Name:             "Multiple Choice, Multiple Answers (Listening)",
			NameCN:           "听力多选题",
			Description:      "Listen to the recording and answer the question by selecting all the correct responses. More than one response is correct.",
			ScoringInfo:      "Scores listening skills. Partial credit scoring applies.",
			TimeLimit:        90,
			QuestionCount:    2,
			ScoreWeight:      "Listening",
			SkillsTested:     models.StringArray{"Listening", "Comprehension"},
			Tips: models.StringArray{
				"记笔记记录关键点",
				"注意关键词和细节",
				"选择所有正确答案",
				"避免选择过多错误选项",
			},
			CommonMistakes: models.StringArray{
				"只选一个答案",
				"选择错误选项扣分",
				"没有记笔记",
				"遗漏信息",
			},
			Color:     "#F59E0B",
			SortOrder: 2,
			IsActive:  true,
		},
		{
			ModuleID:         listeningModule.ID,
			Code:             "fill_blanks_listening",
			Name:             "Fill in the Blanks (Listening)",
			NameCN:           "听力填空",
			Description:      "You will hear a recording. Type the missing words in each blank.",
			ScoringInfo:      "Scores listening and writing skills. Each correct word scores 1 point.",
			TimeLimit:        90,
			QuestionCount:    2,
			ScoreWeight:      "Listening & Writing",
			SkillsTested:     models.StringArray{"Listening", "Writing", "Spelling"},
			Tips: models.StringArray{
				"提前阅读文本",
				"预测可能的词",
				"注意拼写正确",
				"注意单复数和时态",
			},
			CommonMistakes: models.StringArray{
				"拼写错误",
				"单复数错误",
				"没有预读文本",
				"听漏信息",
			},
			Color:     "#F59E0B",
			SortOrder: 3,
			IsActive:  true,
		},
		{
			ModuleID:         listeningModule.ID,
			Code:             "highlight_correct_summary",
			Name:             "Highlight Correct Summary",
			NameCN:           "高亮正确总结",
			Description:      "You will hear a recording. Click on the paragraph that best relates to the recording.",
			ScoringInfo:      "Scores listening and reading skills. 1 point for correct answer.",
			TimeLimit:        90,
			QuestionCount:    2,
			ScoreWeight:      "Listening & Reading",
			SkillsTested:     models.StringArray{"Listening", "Reading", "Comprehension"},
			Tips: models.StringArray{
				"记笔记记录主要内容",
				"找出与录音最匹配的段落",
				"排除明显错误的选项",
				"注意细节差异",
			},
			CommonMistakes: models.StringArray{
				"没有理解主旨",
				"忽略细节",
				"过度推断",
				"笔记不完整",
			},
			Color:     "#F59E0B",
			SortOrder: 4,
			IsActive:  true,
		},
		{
			ModuleID:         listeningModule.ID,
			Code:             "multiple_choice_single_answer_listening",
			Name:             "Multiple Choice, Single Answer (Listening)",
			NameCN:           "听力单选题",
			Description:      "Listen to the recording and answer the multiple-choice question by selecting the correct response. Only one response is correct.",
			ScoringInfo:      "Scores listening skills. 1 point for correct answer.",
			TimeLimit:        60,
			QuestionCount:    2,
			ScoreWeight:      "Listening",
			SkillsTested:     models.StringArray{"Listening", "Comprehension"},
			Tips: models.StringArray{
				"仔细听录音",
				"记笔记",
				"排除错误选项",
				"选择最佳答案",
			},
			CommonMistakes: models.StringArray{
				"没有集中注意力",
				"遗漏关键信息",
				"过度推断",
				"选择部分正确的答案",
			},
			Color:     "#F59E0B",
			SortOrder: 5,
			IsActive:  true,
		},
		{
			ModuleID:         listeningModule.ID,
			Code:             "select_missing_word",
			Name:             "Select Missing Word",
			NameCN:           "选择遗漏单词",
			Description:      "You will hear a recording about an academic subject. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.",
			ScoringInfo:      "Scores listening skills. 1 point for correct answer.",
			TimeLimit:        60,
			QuestionCount:    2,
			ScoreWeight:      "Listening",
			SkillsTested:     models.StringArray{"Listening", "Context", "Prediction"},
			Tips: models.StringArray{
				"理解整体语境",
				"预测可能的词",
				"根据逻辑选择",
				"注意语法一致性",
			},
			CommonMistakes: models.StringArray{
				"没有理解语境",
				"忽略语法",
				"过度推测",
				"没有记笔记",
			},
			Color:     "#F59E0B",
			SortOrder: 6,
			IsActive:  true,
		},
		{
			ModuleID:         listeningModule.ID,
			Code:             "highlight_incorrect_words",
			Name:             "Highlight Incorrect Words",
			NameCN:           "高亮错误词",
			Description:      "You will hear a recording. Below is a transcription of the recording. Some words in the transcription differ from what the speaker said. Please click on the words that are different.",
			ScoringInfo:      "Scores listening and reading skills. Correct clicks score points, incorrect clicks lose points.",
			TimeLimit:        90,
			QuestionCount:    2,
			ScoreWeight:      "Listening & Reading",
			SkillsTested:     models.StringArray{"Listening", "Reading", "Detail"},
			Tips: models.StringArray{
				"边听边对照文本",
				"注意发音相似的词",
				"不要乱点",
				"确认后再点击",
			},
			CommonMistakes: models.StringArray{
				"点击过多",
				"遗漏错误词",
				"没有集中注意力",
				"点击正确的词",
			},
			Color:     "#F59E0B",
			SortOrder: 7,
			IsActive:  true,
		},
		{
			ModuleID:         listeningModule.ID,
			Code:             "write_from_dictation",
			Name:             "Write from Dictation",
			NameCN:           "听写",
			Description:      "You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.",
			ScoringInfo:      "Scores listening and writing skills. Each correct word scores 1 point.",
			TimeLimit:        30,
			QuestionCount:    3,
			ScoreWeight:      "Listening & Writing",
			SkillsTested:     models.StringArray{"Listening", "Writing", "Spelling", "Grammar"},
			Tips: models.StringArray{
				"集中注意力听完整句子",
				"快速记下所有词",
				"注意拼写和标点",
				"不要纠结个别词",
			},
			CommonMistakes: models.StringArray{
				"拼写错误",
				"遗漏单词",
				"添加多余单词",
				"标点错误",
			},
			Color:     "#F59E0B",
			SortOrder: 8,
			IsActive:  true,
		},
	}

	for _, qt := range listeningTypes {
		if err := db.Create(&qt).Error; err != nil {
			return err
		}
	}

	return nil
}
