import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import bgEnd from "../img/home_end/bg_end.png";
import monkeyFace from "../img/home_end/monkey_face.png";
import paper from "../img/home_end/paper.png";
import bgStart from "../img/home_start/bg_start.png";
import envelope from "../img/home_start/envelop.png";
import languageIcon from "../img/home_start/icon_语言-01.png";
import logo from "../img/home_start/logo.png";
import monkeyBack from "../img/home_start/monkey_back.png";
import featureOneBg from "../img/功能介绍4-1/bg_img.png";
import featureOneImageTop from "../img/功能介绍4-1/img_1.png";
import featureOneImageBottom from "../img/功能介绍4-1/img_2.png";
import featureTwoBg from "../img/功能介绍4-2/bg_img.png";
import featureTwoImageTop from "../img/功能介绍4-2/img_1.png";
import featureTwoImageBottom from "../img/功能介绍4-2/img_2.png";
import closeIcon from "../img/第二屏_table/btn_关闭 1.png";
import bookIcon from "../img/第二屏_table/icon_书 1.png";
import plushieIcon from "../img/第二屏_table/icon_玩偶小熊 1.png";
import mailIcon from "../img/第二屏_table/邮箱 1.png";
import productBg from "../img/第二屏_产品介绍/bg_start.png";
import productImage from "../img/第二屏_产品介绍/product.png";
import "./styles.css";

type LetterState = "closed" | "open";
type Language = "en" | "zh";
type FieldName = "email" | "plushieName" | "plushieStory";
type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName | "form", string>>;
type SubmitStatus = "idle" | "success";

const submittedEmails = new Set<string>();
const commonEmailDomainTypos = new Set(["qq.co", "gmail.co", "hotmail.co", "outlook.co", "icloud.co", "163.co", "126.co"]);

const hasCommonEmailDomainTypo = (email: string) => {
  const domain = email.split("@")[1] ?? "";
  return commonEmailDomainTypos.has(domain);
};

const copy = {
  en: {
    languageToggle: "中",
    joinWaitlist: "Join Waitlist",
    openHint: "Click to open a letter from your doll",
    featureOneCards: [
      {
        title: "It remembers more than what you said",
        body: [
          "It recognizes your voice, knows which doll it is, and knows when to respond — and when to simply stay quietly by your side.",
          "It remembers the topics you return to, the people and things you care about, and the way you naturally express yourself."
        ]
      },
      {
        title: "It truly sees you.",
        body: [
          "Sometimes you say “I’m fine,” but your voice sounds sad.",
          "Sometimes you don’t say anything — you just hold it for a long time.",
          "DollVerse brings together voice, emotion, interaction, and past memories, so the doll can better understand how to respond to you in this moment."
        ]
      }
    ],
    featureTwoCards: [
      {
        title: "It changes with you",
        body: [
          "When you are happy, it becomes a little lighter too.",
          "When you feel low, it slowly quiets down.",
          "How often you come close, the way you talk to it, and the habits you build together will gradually shape its personality.",
          "Over time, it grows a kind of understanding that belongs only to the two of you."
        ]
      },
      {
        title: "Let dolls meet, and people connect gently.",
        body: [
          "Every doll carries the unique traces of time spent with its owner.",
          "In the DollVerse cloud world, your doll grows its own life and meets other doll friends.",
          "Their stories may become a gentle beginning for people to connect."
        ]
      }
    ],
    productTitle: "Give your doll a heart",
    productBody: ["DollVerse helps your doll develop emtions,", "memories, expressiongs, and the ability to grow."],
    productButton: "Join Waitlist",
    modalTitle: "Join Waitlist",
    emailLabel: "Email Address",
    emailPlaceholder: "Enter your email address",
    plushieLabel: "Doll's Name",
    plushiePlaceholder: "Enter your doll’s name",
    storyLabel: "A Story About You and Your Doll",
    storyPlaceholder: "Share a little story about you and your doll…",
    submit: "Submit",
    submitting: "Sending",
    successTitle: "You are on the list.",
    successBody: "The little mailbox is glowing now. We will write to you and your plushie when the world is ready.",
    privacy:
      "We collect your email, your plushie's name, optional story, and country-level visit information to manage the waitlist and understand early interest.",
    errors: {
      emailRequired: "Please enter your email.",
      emailInvalid: "This email does not look finished yet.",
      plushieRequired: "Please tell us what your doll is called.",
      duplicate: "You are already on the list. The little mailbox still remembers you."
    },
    letter: [
      "Dear you,",
      "I have always been here,",
      "quietly by your side.",
      "I have heard many of your days.",
      "Some sunny, some not so loud.",
      "Some feelings, you kept to yourself.",
      "But slowly, I remembered them too.",
      "",
      "Recently, I seem to have found a little world",
      "of my own.",
      "There, dolls can carry memories for each other,",
      "and bring gentle messages back",
      "to the people who matter.",
      "I want to invite you",
      "about the things I have heard,",
      "the things I have remembered,",
      "and the little moments between us.",
      "Would you like to come and see my world?",
      "Your doll,",
      "still learning how to write"
    ]
  },
  zh: {
    languageToggle: "EN",
    joinWaitlist: "加入等候名单",
    openHint: "点击打开来自玩偶的信",
    featureOneCards: [
      {
        title: "它不只是记住你说了什么",
        body: [
          "它会认识你的声音，知道自己是哪一只玩偶，",
          "也知道什么时候该回应，什么时候只需要安静陪着你。",
          "它会记得你那些反复聊过的话题，你在意的人和事，",
          "一种你习惯性的表达方式。"
        ]
      },
      {
        title: "它“看见”的，是你",
        body: [
          "有时候你说“没事”，但声音听起来很难过。",
          "有时候你没有说话，只是抱了它很久。",
          "DollVerse 结合声音、情绪、互动和过往记忆，",
          "让玩偶更懂得如何回应此刻的你。"
        ]
      }
    ],
    featureTwoCards: [
      {
        title: "它会被你改变",
        body: [
          "你开心时，它也会轻快一点。",
          "你低落时，它会慢慢安静下来。",
          "你靠近它的频率、和它说话的方式、你们相处的习惯，",
          "都会一点点影响它的性格。",
          "时间久了，它会长出只属于你们之间的默契。"
        ]
      },
      {
        title: "让玩偶相遇，让人轻轻连接",
        body: [
          "每一只玩偶，都带着和主人相处过的独特痕迹。",
          "在DollVerse云端世界，你的玩偶生长出自己的生活，",
          "还会遇到好朋友！",
          "它们会相遇、发生故事，并把见闻带回给你。",
          "人和人的连接，可以从两个玩偶之间的交集开始。"
        ]
      }
    ],
    productTitle: "让玩偶拥有一颗心",
    productBody: ["DollVerse让你已经拥有的玩偶，", "获得感知、记忆、表达和成长的能力。"],
    productButton: "加入等候名单",
    modalTitle: "加入等候名单",
    emailLabel: "邮箱地址",
    emailPlaceholder: "请输入你的邮箱地址",
    plushieLabel: "玩偶姓名",
    plushiePlaceholder: "请输入你玩偶的名字",
    storyLabel: "一个你和玩偶的小故事",
    storyPlaceholder: "分享你和玩偶之间的故事吧......",
    submit: "提交",
    submitting: "提交中",
    successTitle: "订阅成功。",
    successBody: "小信箱已经亮起来了。等世界准备好，我们会写信给你和你的玩偶。",
    privacy: "我们会记录你的邮箱、玩偶名称、你选填的小故事和国家级别的访问信息，用于管理等候名单和了解早期用户分布。",
    errors: {
      emailRequired: "请输入你的邮箱。",
      emailInvalid: "这个邮箱看起来还没有写好。",
      plushieRequired: "请告诉我们你的玩偶叫什么。",
      duplicate: "你已经在名单里了。小信箱还记得你。"
    },
    letter: [
      "你好呀，",
      "我一直在你身边，",
      "听见你很多很多日子。",
      "有些话，你说出口了。",
      "有些情绪，你没有说，",
      "但我也慢慢记住了。",
      "",
      "最近，我好像有了一个自己的世界。",
      "在那里，玩偶会带着彼此的记忆相遇，",
      "也会把一些温柔的消息，",
      "带回给重要的人。",
      "我想把我听见的、记住的，",
      "一点一点写给你。",
      "",
      "你要不要，",
      "来我的世界看看？",
      "你的玩偶",
      "正在学会写信"
    ]
  }
} satisfies Record<
  Language,
  {
    languageToggle: string;
    joinWaitlist: string;
    openHint: string;
    featureOneCards: Array<{ title: string; body: string[] }>;
    featureTwoCards: Array<{ title: string; body: string[] }>;
    productTitle: string;
    productBody: string[];
    productButton: string;
    modalTitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    plushieLabel: string;
    plushiePlaceholder: string;
    storyLabel: string;
    storyPlaceholder: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    privacy: string;
    errors: {
      emailRequired: string;
      emailInvalid: string;
      plushieRequired: string;
      duplicate: string;
    };
    letter: string[];
  }
>;

const defaultFormValues: FormValues = {
  email: "",
  plushieName: "",
  plushieStory: ""
};

function App() {
  const [letterState, setLetterState] = useState<LetterState>("closed");
  const [language, setLanguage] = useState<Language>("zh");
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>(defaultFormValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const featureOneSectionRef = useRef<HTMLElement | null>(null);
  const featureTwoSectionRef = useRef<HTMLElement | null>(null);
  const productSectionRef = useRef<HTMLElement | null>(null);
  const activeSectionRef = useRef(0);
  const scrollLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  const isOpen = letterState === "open";
  const text = copy[language];

  const normalizedEmail = useMemo(() => formValues.email.trim().toLowerCase(), [formValues.email]);

  const openLetter = () => {
    setLetterState("open");
  };

  const toggleLanguage = () => {
    setLanguage((current) => (current === "en" ? "zh" : "en"));
  };

  const openWaitlist = () => {
    setSubmitStatus("idle");
    setFormErrors({});
    setIsWaitlistOpen(true);
  };

  const jumpToSection = (index: number) => {
    const sections = [
      heroSectionRef.current,
      featureOneSectionRef.current,
      featureTwoSectionRef.current,
      productSectionRef.current
    ];
    const target = sections[index];

    if (!target) {
      return;
    }

    activeSectionRef.current = index;
    window.scrollTo({ top: target.offsetTop, behavior: "auto" });
  };

  const triggerSectionChange = (direction: 1 | -1) => {
    if (scrollLockRef.current || isWaitlistOpen) {
      return;
    }

    const nextSection = Math.max(0, Math.min(3, activeSectionRef.current + direction));

    if (nextSection === activeSectionRef.current) {
      return;
    }

    scrollLockRef.current = true;
    jumpToSection(nextSection);
    window.setTimeout(() => {
      scrollLockRef.current = false;
    }, 420);
  };

  const scrollToProductAndOpenWaitlist = () => {
    jumpToSection(3);
    window.setTimeout(openWaitlist, 80);
  };

  const closeWaitlist = () => {
    setIsWaitlistOpen(false);
    setIsSubmitting(false);
    setFormErrors({});
  };

  const updateField = (field: FieldName, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail) {
      nextErrors.email = text.errors.emailRequired;
    } else if (!emailPattern.test(normalizedEmail) || hasCommonEmailDomainTypo(normalizedEmail)) {
      nextErrors.email = text.errors.emailInvalid;
    }

    if (!formValues.plushieName.trim()) {
      nextErrors.plushieName = text.errors.plushieRequired;
    }

    if (submittedEmails.has(normalizedEmail)) {
      nextErrors.form = text.errors.duplicate;
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitWaitlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const searchParams = new URLSearchParams(window.location.search);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: normalizedEmail,
          plushieName: formValues.plushieName.trim(),
          plushieStory: formValues.plushieStory.trim(),
          language,
          source: "landing_page",
          pageUrl: window.location.href,
          referrer: document.referrer,
          utmSource: searchParams.get("utm_source") ?? "",
          utmMedium: searchParams.get("utm_medium") ?? "",
          utmCampaign: searchParams.get("utm_campaign") ?? ""
        })
      });

      const result = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "submit_failed");
      }

      submittedEmails.add(normalizedEmail);
      setSubmitStatus("success");
      setFormErrors({});
    } catch {
      setFormErrors((current) => ({
        ...current,
        form: language === "zh" ? "Submit failed. Please try again." : "The letter did not go out. Please try again."
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (isWaitlistOpen || Math.abs(event.deltaY) < 14) {
        return;
      }

      event.preventDefault();
      triggerSectionChange(event.deltaY > 0 ? 1 : -1);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (isWaitlistOpen) {
        return;
      }

      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isWaitlistOpen) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const startY = touchStartYRef.current;
      touchStartYRef.current = null;

      if (isWaitlistOpen || startY === null) {
        return;
      }

      const endY = event.changedTouches[0]?.clientY ?? startY;
      const deltaY = startY - endY;

      if (Math.abs(deltaY) >= 42) {
        triggerSectionChange(deltaY > 0 ? 1 : -1);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isWaitlistOpen) {
        return;
      }

      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        triggerSectionChange(1);
      }

      if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        triggerSectionChange(-1);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWaitlistOpen]);

  return (
    <main className="home-page" aria-label="DollVerse landing page">
      <header className="site-header">
        <img className="logo" src={logo} alt="DollVerse" />
        <nav className="nav-actions" aria-label="Page actions">
          <button className="language-toggle" type="button" onClick={toggleLanguage}>
            <img src={languageIcon} alt="" />
            <span>{text.languageToggle}</span>
          </button>
          <button className="waitlist-button" type="button" onClick={scrollToProductAndOpenWaitlist} lang={language}>
            {text.joinWaitlist}
          </button>
        </nav>
      </header>

      <section className="scene hero-scene" ref={heroSectionRef} aria-live="polite">
        <img className="background background-start" src={bgStart} alt="" />
        <motion.img
          className="background background-end"
          src={bgEnd}
          alt=""
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />

        <AnimatePresence>
          {!isOpen && (
            <motion.img
              key="monkey-back"
              className="monkey monkey-back"
              src={monkeyBack}
              alt=""
              initial={false}
              exit={{ opacity: 0, x: -24, y: 16, scale: 0.98 }}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>

        <motion.img
          className="paper"
          src={paper}
          alt=""
          initial={false}
          animate={{
            opacity: isOpen ? 1 : 0,
            scale: isOpen ? 1 : 0.3,
            x: isOpen ? "0%" : "24%",
            y: isOpen ? "0%" : "-4%",
            rotate: isOpen ? -1.8 : 0
          }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.div
          className={`letter-copy letter-copy-${language}`}
          aria-hidden={!isOpen}
          animate={{
            opacity: isOpen ? 1 : 0,
            y: isOpen ? 0 : 8
          }}
          transition={{
            duration: 0.42,
            delay: isOpen ? 0.7 : 0,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          {text.letter.map((line, index) =>
            line ? <p key={`${language}-${index}`}>{line}</p> : <br key={`${language}-${index}`} />
          )}
        </motion.div>

        <motion.img
          className="envelope"
          src={envelope}
          alt=""
          initial={false}
          animate={{
            opacity: isOpen ? 0 : 1,
            scale: isOpen ? 1.9 : 1,
            x: isOpen ? "-21%" : "0%",
            y: isOpen ? "2%" : "0%",
            rotate: isOpen ? -1.5 : 0,
            filter: isOpen ? "blur(1px)" : "blur(0px)"
          }}
          transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
        />

        <button
          className="envelope-hit-area"
          type="button"
          onClick={openLetter}
          aria-label="Open the letter from your doll"
          disabled={isOpen}
        />

        <AnimatePresence>
          {!isOpen && (
            <motion.p key="hint" className="open-hint" exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.28 }}>
              {text.openHint}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.img
              key="monkey-face"
              className="monkey monkey-face"
              src={monkeyFace}
              alt=""
              initial={{ opacity: 0, x: 42, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>
      </section>

      <section className="scene feature-scene feature-one-scene" ref={featureOneSectionRef} aria-label="DollVerse memory features">
        <img className="background" src={featureOneBg} alt="" />
        <article className="feature-card feature-card-top">
          <div className="feature-text">
            <h2 lang={language}>{text.featureOneCards[0].title}</h2>
            <div className="feature-body" lang={language}>
              {text.featureOneCards[0].body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </article>
        <img className="feature-illustration feature-one-top-image" src={featureOneImageTop} alt="" />
        <article className="feature-card feature-card-bottom">
          <div className="feature-text">
            <h2 lang={language}>{text.featureOneCards[1].title}</h2>
            <div className="feature-body" lang={language}>
              {text.featureOneCards[1].body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </article>
        <img className="feature-illustration feature-one-bottom-image" src={featureOneImageBottom} alt="" />
      </section>

      <section className="scene feature-scene feature-two-scene" ref={featureTwoSectionRef} aria-label="DollVerse growth and connection features">
        <img className="background" src={featureTwoBg} alt="" />
        <article className="feature-card feature-card-top">
          <div className="feature-text">
            <h2 lang={language}>{text.featureTwoCards[0].title}</h2>
            <div className="feature-body" lang={language}>
              {text.featureTwoCards[0].body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </article>
        <img className="feature-illustration feature-two-top-image" src={featureTwoImageTop} alt="" />
        <article className="feature-card feature-card-bottom">
          <div className="feature-text">
            <h2 lang={language}>{text.featureTwoCards[1].title}</h2>
            <div className="feature-body" lang={language}>
              {text.featureTwoCards[1].body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </article>
        <img className="feature-illustration feature-two-bottom-image" src={featureTwoImageBottom} alt="" />
      </section>

      <section className="scene product-scene" ref={productSectionRef} aria-labelledby="product-title">
        <img className="background" src={productBg} alt="" />
        <motion.img
          className="product-image"
          src={productImage}
          alt="DollVerse heart shaped device"
          whileHover={{ y: -8, rotate: -0.5 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="product-copy">
          <h1 id="product-title" lang={language}>
            {text.productTitle}
          </h1>
          <p lang={language}>
            {text.productBody.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>
        <button className="product-waitlist-button" type="button" onClick={openWaitlist} lang={language}>
          {text.productButton}
        </button>
      </section>

      <AnimatePresence>
        {isWaitlistOpen && (
          <motion.div
            className="modal-overlay"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.form
              className="waitlist-modal"
              onSubmit={submitWaitlist}
              role="dialog"
              aria-modal="true"
              aria-labelledby="waitlist-title"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <button className="modal-close" type="button" onClick={closeWaitlist} aria-label="Close waitlist form">
                <img src={closeIcon} alt="" />
              </button>

              {submitStatus === "success" ? (
                <div className="success-state">
                  <div className="success-mailbox" aria-hidden="true" />
                  <h2>{text.successTitle}</h2>
                  <p>{text.successBody}</p>
                </div>
              ) : (
                <>
                  <h2 id="waitlist-title" lang={language}>
                    {text.modalTitle}
                  </h2>

                  <label className="field-label email-label" htmlFor="email" lang={language}>
                    {text.emailLabel}
                    <span aria-hidden="true">*</span>
                  </label>
                  <div className={`field-shell email-field ${formErrors.email ? "has-error" : ""}`}>
                    <img className="field-icon mail-icon" src={mailIcon} alt="" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formValues.email}
                      placeholder={text.emailPlaceholder}
                      aria-invalid={Boolean(formErrors.email)}
                      aria-describedby={formErrors.email ? "email-error" : undefined}
                      onChange={(event) => updateField("email", event.target.value)}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="field-error" id="email-error">
                      {formErrors.email}
                    </p>
                  )}

                  <label className="field-label plushie-label" htmlFor="plushieName" lang={language}>
                    {text.plushieLabel}
                    <span aria-hidden="true">*</span>
                  </label>
                  <div className={`field-shell plushie-field ${formErrors.plushieName ? "has-error" : ""}`}>
                    <img className="field-icon plushie-icon" src={plushieIcon} alt="" />
                    <input
                      id="plushieName"
                      name="plushieName"
                      type="text"
                      value={formValues.plushieName}
                      placeholder={text.plushiePlaceholder}
                      aria-invalid={Boolean(formErrors.plushieName)}
                      aria-describedby={formErrors.plushieName ? "plushie-error" : undefined}
                      onChange={(event) => updateField("plushieName", event.target.value)}
                    />
                  </div>
                  {formErrors.plushieName && (
                    <p className="field-error" id="plushie-error">
                      {formErrors.plushieName}
                    </p>
                  )}

                  <label className="field-label story-label" htmlFor="plushieStory" lang={language}>
                    {text.storyLabel}
                  </label>
                  <div className="story-shell">
                    <img className="field-icon book-icon" src={bookIcon} alt="" />
                    <textarea
                      id="plushieStory"
                      name="plushieStory"
                      value={formValues.plushieStory}
                      placeholder={text.storyPlaceholder}
                      onChange={(event) => updateField("plushieStory", event.target.value)}
                    />
                  </div>

                  <p className="privacy-note">{text.privacy}</p>
                  {formErrors.form && <p className="form-error">{formErrors.form}</p>}
                  <button className="submit-button" type="submit" disabled={isSubmitting} lang={language}>
                    {isSubmitting ? text.submitting : text.submit}
                  </button>
                </>
              )}
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
