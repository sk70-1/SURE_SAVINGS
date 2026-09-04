import json
from pathlib import Path

translations_to_add = {
    "moneyPlan": {
        "whySurplusPoint1": {
            "en": "Your recent income ({income}) exceeded your weekly baseline.",
            "bn": "আপনার সাম্প্রতিক আয় ({income}) আপনার সাপ্তাহিক ভিত্তির চেয়ে বেশি হয়েছে।",
            "hi": "आपकी हाल की आय ({income}) आपके साप्ताहिक आधार से अधिक रही।",
            "ta": "உங்கள் சமீபத்திய வருமானம் ({income}) வாராந்திர இயல்பை விட அதிகமாக உள்ளது."
        },
        "whySurplusPoint2": {
            "en": "This recommendation leaves your essential bills and living costs fully funded.",
            "bn": "এই সুপারিশটি আপনার প্রয়োজনীয় বিল এবং জীবনযাত্রার ব্যয় সম্পূর্ণরূপে সুরক্ষিত রাখে।",
            "hi": "यह सिफारिश आपके आवश्यक बिलों और जीवन-यापन के खर्चों को पूरी तरह सुरक्षित रखती है।",
            "ta": "இந்த பரிந்துரை உங்கள் அத்தியாவசிய பில்கள் மற்றும் வாழ்க்கைச் செலவுகளுக்கு முழு நிதி ஒதுக்குகிறது."
        },
        "whySurplusPoint3": {
            "en": "Your emergency savings will stay protected for when gig demand slows down.",
            "bn": "কাজের চাহিদা কমে গেলে সুরক্ষার জন্য আপনার জরুরি সঞ্চয় তৈরি থাকবে।",
            "hi": "काम कम होने वाले हफ्तों के लिए आपकी आपातकालीन बचत सुरक्षित रहेगी।",
            "ta": "வேலை வாய்ப்பு குறையும் போது உதவ உங்கள் அவசரகால சேமிப்பு பாதுகாப்பாக இருக்கும்."
        },
        "whySlowPoint1": {
            "en": "Your emergency savings are meant to smooth out slow or unpaid weeks.",
            "bn": "মন্দা বা পেমেন্টহীন সপ্তাহগুলো সামাল দিতেই আপনার জরুরি সঞ্চয় তৈরি করা হয়েছে।",
            "hi": "कम या बिना कमाई वाले हफ्तों में सहारा देने के लिए ही आपातकालीन बचत है।",
            "ta": "வருமானம் குறைந்த வாரங்களை எளிதாகக் கடக்கவே உங்கள் அவசரகால சேமிப்பு உள்ளது."
        },
        "whySlowPoint2": {
            "en": "Drawing {amount} keeps you above your minimum safe floor.",
            "bn": "{amount} উত্তোলন করলেও আপনি আপনার নিরাপদ ন্যূনতম সীমার ওপরে থাকবেন।",
            "hi": "{amount} निकालने के बाद भी आप अपने सुरक्षित न्यूनतम स्तर से ऊपर रहेंगे।",
            "ta": "{amount} எடுப்பது உங்கள் குறைந்தபட்ச பாதுகாப்பான அளவுக்கு மேல் உங்களை வைத்திருக்கும்."
        },
        "whySlowPoint3": {
            "en": "You can replenish your cushion once payouts pick back up.",
            "bn": "পরবর্তী অর্থ প্রাপ্তির পর আপনি সহজেই এই তহবিল পুনরায় পূরণ করতে পারবেন।",
            "hi": "कमाई दोबारा बढ़ने पर आप अपनी बचत फिर से भर सकते हैं।",
            "ta": "அடுத்த வருமானம் வந்தவுடன் உங்கள் சேமிப்பை மீண்டும் நிரப்பலாம்."
        },
        "whyBillsPoint1": {
            "en": "Upcoming bills require funds in your regular bank account.",
            "bn": "আসন্ন বিল পরিশোধের জন্য আপনার নিয়মিত ব্যাংক অ্যাকাউন্টে টাকা থাকা প্রয়োজন।",
            "hi": "आगामी बिलों के लिए आपके बैंक खाते में पर्याप्त राशि होना जरूरी है।",
            "ta": "வரவிருக்கும் பில்களுக்கு உங்கள் வங்கிக் கணக்கில் பணம் இருக்க வேண்டும்."
        },
        "whyBillsPoint2": {
            "en": "Keeping cash ready now prevents cash-flow pinches later this month.",
            "bn": "এখন টাকা প্রস্তুত রাখলে চলতি মাসের শেষের দিকে আর্থিক টানাটানি এড়ানো যাবে।",
            "hi": "अभी पैसे तैयार रखने से महीने के अंत में पैसों की तंगी नहीं होगी।",
            "ta": "இப்போது பணத்தை தயாராக வைத்திருப்பது மாத இறுதியில் நிதி நெருக்கடியைத் தடுக்கும்."
        },
        "whyBillsPoint3": {
            "en": "We'll alert you when it's safe to start saving again.",
            "bn": "আবার যখন সঞ্চয় করা নিরাপদ হবে, আমরা আপনাকে জানিয়ে দেব।",
            "hi": "जब दोबारा बचत करना सुरक्षित होगा, हम आपको सूचित करेंगे।",
            "ta": "மீண்டும் சேமிப்பது பாதுகாப்பானதாக இருக்கும்போது நாங்கள் உங்களுக்கு நினைவூட்டுவோம்."
        }
    },
    "dashboard": {
        "buildMoneyPlanTitle": {
            "en": "Let’s build your money plan",
            "bn": "চলুন আপনার আর্থিক পরিকল্পনা তৈরি করি",
            "hi": "आइए आपका मनी प्लान बनाएं",
            "ta": "உங்கள் பணத் திட்டத்தை உருவாக்குவோம்"
        },
        "buildMoneyPlanSubtitle": {
            "en": "Add one income payment and one essential expense. We’ll create a safe plan for your next week.",
            "bn": "একটি আয়ের রেকর্ড এবং একটি অপরিহার্য খরচের রেকর্ড যোগ করুন। আমরা পরবর্তী সপ্তাহের জন্য একটি নিরাপদ পরিকল্পনা তৈরি করব।",
            "hi": "एक आय और एक अनिवार्य खर्च जोड़ें। हम आपके अगले सप्ताह के लिए एक सुरक्षित योजना बनाएंगे।",
            "ta": "ஒரு வருமானம் மற்றும் ஒரு அத்தியாவசிய செலவைச் சேர்க்கவும். அடுத்த வாரத்திற்கான பாதுகாப்பான திட்டத்தை உருவாக்குவோம்."
        },
        "loadArjunDemo": {
            "en": "Or load Arjun's demo sandbox with sample transactions",
            "bn": "অথবা নমুনা লেনদেনসহ অর্জুনের ডেমো স্যান্ডবক্স লোড করুন",
            "hi": "या नमूना लेनदेन के साथ अर्जुन का डेमो सैंडबॉक्स लोड करें",
            "ta": "அல்லது அர்ஜுனின் டெமோ சாண்ட்பாக்ஸை மாதிரி பரிவர்த்தனைகளுடன் ஏற்றவும்"
        },
        "hideDetails": {
            "en": "Hide detailed metrics, charts & history",
            "bn": "বিস্তারিত মেট্রিক্স, চার্ট ও ইতিহাস লুকান",
            "hi": "विस्तृत मेट्रिक्स, चार्ट और इतिहास छिपाएं",
            "ta": "விரிவான அளவீடுகள், வரைபடங்கள் மற்றும் வரலாற்றை மறை"
        },
        "showDetails": {
            "en": "See detailed analytics, money safety breakdown & history",
            "bn": "বিস্তারিত অ্যানালিটিক্স, আর্থিক সুরক্ষা বিশ্লেষণ ও ইতিহাস দেখুন",
            "hi": "विस्तृत एनालिटिक्स, वित्तीय सुरक्षा विवरण और इतिहास देखें",
            "ta": "விரிவான பகுப்பாய்வு, பணப் பாதுகாப்பு விவரங்கள் மற்றும் வரலாற்றைக் காண்க"
        },
        "demoSandbox": {
            "en": "Demo Sandbox",
            "bn": "ডেমো স্যান্ডবক্স",
            "hi": "डेमो सैंडबॉक्स",
            "ta": "டெமோ சாண்ட்பாக்ஸ்"
        }
    },
    "resilienceGauge": {
        "newAccount": {
            "en": "New Account",
            "bn": "নতুন প্রোফাইল",
            "hi": "नया खाता",
            "ta": "புதிய கணக்கு"
        },
        "newAccountDesc": {
            "en": "Add your first income and expenses to calculate your score.",
            "bn": "আপনার সক্ষমতা স্কোর জানতে প্রথম আয় এবং ব্যয়ের তথ্য যোগ করুন।",
            "hi": "अपना स्कोर जानने के लिए पहली आय और खर्च दर्ज करें।",
            "ta": "உங்கள் மதிப்பெண்ணைக் கணக்கிட முதல் வருமானம் மற்றும் செலவைச் சேர்க்கவும்."
        },
        "scoreLabel": {
            "en": "Score",
            "bn": "স্কোর",
            "hi": "स्कोर",
            "ta": "மதிப்பெண்"
        },
        "adviceAtRisk": {
            "en": "Your savings are low right now. Try to save small amounts during good weeks.",
            "bn": "আপনার সঞ্চয় বর্তমানে কম। ভালো উপার্জনের সপ্তাহগুলোতে অল্প অল্প সঞ্চয় করার চেষ্টা করুন।",
            "hi": "आपकी बचत अभी कम है। अच्छी कमाई वाले हफ्तों में थोड़ी बचत करने का प्रयास करें।",
            "ta": "உங்கள் சேமிப்பு இப்போது குறைவாக உள்ளது. நல்ல வருமானம் உள்ள வாரங்களில் சிறிதளவு சேமிக்க முயற்சிக்கவும்."
        },
        "adviceFair": {
            "en": "Decent stability. Adding a little more will give you total peace of mind.",
            "bn": "মোটামুটি স্থিতিশীল। আর কিছুটা সঞ্চয় করলে আপনি সম্পূর্ণ নিশ্চিন্ত থাকতে পারবেন।",
            "hi": "संतोषजनक स्थिरता। थोड़ा और जोड़ने से आपको पूर्ण मानसिक शांति मिलेगी।",
            "ta": "மிதமான நிலைத்தன்மை. இன்னும் கொஞ்சம் சேர்ப்பது முழு மன அமைதியைத் தரும்."
        },
        "adviceGood": {
            "en": "Good cushion! You can absorb slower gig periods without stress.",
            "bn": "চমৎকার কুশন! কাজের মন্দার সময়েও আপনি কোনো চাপ ছাড়াই কাটিয়ে উঠতে পারবেন।",
            "hi": "अच्छा कुशन! आप बिना तनाव के काम की मंदी को संभाल सकते हैं।",
            "ta": "நல்ல பாதுகாப்பு! வேலை வாய்ப்பு குறைந்த காலத்தை மன அழுத்தமின்றி சமாளிக்கலாம்."
        },
        "adviceExcellent": {
            "en": "Outstanding! You have multiple weeks of essential expenses saved.",
            "bn": "অসাধারণ! আপনার কাছে একাধিক সপ্তাহের অপরিহার্য খরচের সঞ্চয় রয়েছে।",
            "hi": "उत्कृष्ट! आपके पास कई हफ्तों के अनिवार्य खर्चों की बचत है।",
            "ta": "அற்புதம்! பல வாரங்களுக்கான அத்தியாவசிய செலவு சேமிப்பு உங்களிடம் உள்ளது."
        },
        "emergencyCushion": {
            "en": "Emergency Cushion",
            "bn": "জরুরি কুশন",
            "hi": "आपातकालीन कुशन",
            "ta": "அவசரகால குஷன்"
        },
        "expenseControl": {
            "en": "Expense Control",
            "bn": "খরচ নিয়ন্ত্রণ",
            "hi": "खर्च नियंत्रण",
            "ta": "செலவு கட்டுப்பாடு"
        },
        "cashFlowSafety": {
            "en": "Cash Flow Safety",
            "bn": "ক্যাশ ফ্লো সুরক্ষা",
            "hi": "कैश फ्लो सुरक्षा",
            "ta": "பணப்புழக்க பாதுகாப்பு"
        }
    },
    "bufferCard": {
        "startingOut": {
            "en": "Starting Out",
            "bn": "নতুন সূচনা",
            "hi": "शुरुआत",
            "ta": "ஆரம்ப நிலை"
        },
        "startingOutDesc": {
            "en": "Add your first deposit or payout to build your savings.",
            "bn": "আপনার জরুরি সঞ্চয় তৈরি করতে প্রথম আমানত বা আয় যোগ করুন।",
            "hi": "अपनी बचत बनाने के लिए पहला डिपॉजिट या कमाई जोड़ें।",
            "ta": "உங்கள் சேமிப்பை உருவாக்க முதல் வைப்பு அல்லது வருமானத்தைச் சேர்க்கவும்."
        },
        "untouchableDesc": {
            "en": "Untouchable for rent & food",
            "bn": "বাড়িভাড়া ও খাবারের জন্য অক্ষত",
            "hi": "किराया और भोजन के लिए सुरक्षित",
            "ta": "வாடகை மற்றும் உணவிற்கு தொட முடியாதது"
        },
        "availableDesc": {
            "en": "Available for emergencies",
            "bn": "জরুরি প্রয়োজনে ব্যবহারযোগ্য",
            "hi": "आपात स्थिति के लिए उपलब्ध",
            "ta": "அவசர தேவைகளுக்கு கிடைக்கும்"
        }
    },
    "incomeAnalyticsCard": {
        "needsHistory": {
            "en": "Needs History",
            "bn": "ইতিহাস প্রয়োজন",
            "hi": "इतिहास आवश्यक",
            "ta": "வரலாறு தேவை"
        },
        "needsHistoryDesc": {
            "en": "Record a few earnings payouts to establish your weekly normal pay.",
            "bn": "আপনার সাপ্তাহিক স্বাভাবিক আয় নির্ধারণ করতে কয়েকটি পেমেন্ট লিপিবদ্ধ করুন।",
            "hi": "अपनी सामान्य साप्ताहिक आय तय करने के लिए कुछ भुगतान दर्ज करें।",
            "ta": "வாராந்திர இயல்பான வருமானத்தை அறிய சில கொடுப்பனவுகளைப் பதிவு செய்யவும்."
        },
        "normalFluctuations": {
            "en": "Normal Fluctuations",
            "bn": "স্বাভাবিক ওঠানামা",
            "hi": "सामान्य उतार-चढ़ाव",
            "ta": "இயல்பான மாற்றங்கள்"
        },
        "thisWeekPay": {
            "en": "This Week's Pay",
            "bn": "চলতি সপ্তাহের আয়",
            "hi": "इस सप्ताह की कमाई",
            "ta": "இந்த வார வருமானம்"
        },
        "earningsTrend": {
            "en": "Earnings Trend",
            "bn": "উপার্জনের ধারা",
            "hi": "कमाई का रुझान",
            "ta": "வருமான போக்கு"
        },
        "trendGrowing": {
            "en": "Growing",
            "bn": "ক্রমবর্ধমান",
            "hi": "बढ़ रहा है",
            "ta": "வளர்கிறது"
        },
        "trendDeclining": {
            "en": "Declining",
            "bn": "হ্রাসমান",
            "hi": "घट रहा है",
            "ta": "குறைகிறது"
        },
        "trendStable": {
            "en": "Stable",
            "bn": "স্থিতিশীল",
            "hi": "स्थिर",
            "ta": "நிலையானது"
        },
        "formulaFallback": {
            "en": "Calculated from your past payout cycles to protect against income dips.",
            "bn": "আয়ের অপ্রত্যাশিত হ্রাস থেকে সুরক্ষা দিতে আপনার পূর্ববর্তী পে-আউটের ভিত্তিতে গণনাকৃত।",
            "hi": "आय में गिरावट से सुरक्षा के लिए आपके पिछले भुगतान चक्रों से गणना की गई।",
            "ta": "வருமான வீழ்ச்சியிலிருந்து பாதுகாக்க முந்தைய கொடுப்பனவுகளின் அடிப்படையில் கணக்கிடப்பட்டது."
        }
    },
    "recommendations": {
        "greatShapeTitle": {
            "en": "You're in Great Shape!",
            "bn": "আপনার আর্থিক অবস্থা চমৎকার!",
            "hi": "आपकी वित्तीय स्थिति बहुत अच्छी है!",
            "ta": "நீங்கள் சிறந்த நிலையில் உள்ளீர்கள்!"
        },
        "greatShapeDesc": {
            "en": "Your daily spending cash and emergency savings are well balanced.",
            "bn": "আপনার দৈনিক হাতখরচ এবং জরুরি সঞ্চয়ের মধ্যে দারুণ ভারসাম্য রয়েছে।",
            "hi": "आपके दैनिक खर्च और आपातकालीन बचत में बहुत अच्छा संतुलन है।",
            "ta": "உங்கள் தினசரி செலவு மற்றும் அவசரகால சேமிப்பு நன்கு சீராக உள்ளது."
        },
        "actionsCount": {
            "en": "Recommended Actions ({count})",
            "bn": "প্রস্তাবিত পদক্ষেপ ({count})",
            "hi": "अनुशंसित कदम ({count})",
            "ta": "பரிந்துரைக்கப்பட்ட நடவடிக்கைகள் ({count})"
        },
        "supportiveGuidance": {
            "en": "Supportive guidance",
            "bn": "সহায়ক পরামর্শ",
            "hi": "मददगार मार्गदर्शन",
            "ta": "ஆதரவு வழிகாட்டுதல்"
        },
        "safeAction": {
            "en": "Safe Action",
            "bn": "নিরাপদ পদক্ষেপ",
            "hi": "सुरक्षित कदम",
            "ta": "பாதுகாப்பான நடவடிக்கை"
        },
        "confidence": {
            "en": "How sure we are: {percent}%",
            "bn": "নিশ্চয়তার মাত্রা: {percent}%",
            "hi": "सटीकता: {percent}%",
            "ta": "நம்பகத்தன்மை: {percent}%"
        },
        "whyLabel": {
            "en": "Why:",
            "bn": "কারণ:",
            "hi": "कारण:",
            "ta": "காரணம்:"
        },
        "notNow": {
            "en": "Not now",
            "bn": "এখন নয়",
            "hi": "अभी नहीं",
            "ta": "இப்போது வேண்டாம்"
        },
        "keepCashTitle": {
            "en": "Keep money in your checking account",
            "bn": "অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স রাখুন",
            "hi": "बैंक खाते में पैसे तैयार रखें",
            "ta": "வங்கிக் கணக்கில் பணத்தை தயாராக வைக்கவும்"
        },
        "keepCashWhy": {
            "en": "You have essential bills coming due in the next few days.",
            "bn": "আগামী কয়েক দিনের মধ্যে আপনার জরুরি কিছু বিল পরিশোধ করতে হবে।",
            "hi": "अगले कुछ दिनों में आपके आवश्यक बिल देय हैं।",
            "ta": "அடுத்த சில நாட்களில் உங்கள் அத்தியாவசிய பில்கள் செலுத்தப்பட வேண்டும்."
        },
        "keepCashImpact": {
            "en": "Ensures your bank account stays safely positive when bills are debited.",
            "bn": "বিল কাটার পরেও আপনার ব্যাংক অ্যাকাউন্ট নিরাপদে ইতিবাচক থাকবে।",
            "hi": "बिल कटने पर भी आपका बैंक बैलेंस सुरक्षित और पॉजिटिव रहेगा।",
            "ta": "பில்கள் கழிக்கப்படும்போது உங்கள் வங்கிக் கணக்கு பாதுகாப்பாக இருப்பதை உறுதி செய்கிறது."
        },
        "keepCashCta": {
            "en": "Got it, keeping cash ready",
            "bn": "বুঝেছি, টাকা তৈরি রাখছি",
            "hi": "समझ गया, पैसे तैयार रख रहा हूँ",
            "ta": "புரிந்தது, பணத்தை தயாராக வைக்கிறேன்"
        },
        "saveSurplusAction": {
            "en": "Set aside {amount}",
            "bn": "{amount} আলাদা করে রাখুন",
            "hi": "{amount} अलग रखें",
            "ta": "{amount} ஒதுக்கி வைக்கவும்"
        },
        "saveSurplusWhy": {
            "en": "Your upcoming essential expenses and rent are securely funded.",
            "bn": "আপনার আসন্ন অপরিহার্য খরচ ও বাড়িভাড়া সুরক্ষিত রয়েছে।",
            "hi": "आपके आगामी आवश्यक खर्च और किराया सुरक्षित रूप से वित्तपोषित हैं।",
            "ta": "உங்கள் வரவிருக்கும் அத்தியாவசிய செலவுகள் மற்றும் வாடகை பாதுகாப்பாக உள்ளன."
        },
        "saveSurplusImpact": {
            "en": "You will still have your normal allowance for daily groceries and living expenses.",
            "bn": "দৈনিক মুদি ও জীবনযাত্রার খরচের জন্য এখনও আপনার স্বাভাবিক বরাদ্দ অবশিষ্ট থাকবে।",
            "hi": "दैनिक राशन और जीवन यापन के खर्चों के लिए आपका सामान्य बजट बचा रहेगा।",
            "ta": "தினசரி மளிகை மற்றும் வாழ்க்கைச் செலவுகளுக்கான இயல்பான நிதி உங்களிடம் இருக்கும்."
        },
        "saveSurplusCta": {
            "en": "Add {amount} to emergency savings",
            "bn": "জরুরি সঞ্চয়ে {amount} জমা দিন",
            "hi": "आपातकालीन बचत में {amount} जोड़ें",
            "ta": "அவசரகால சேமிப்பில் {amount} சேர்க்கவும்"
        },
        "useBufferAction": {
            "en": "Use {amount} from savings",
            "bn": "সঞ্চয় থেকে {amount} ব্যবহার করুন",
            "hi": "बचत से {amount} उपयोग करें",
            "ta": "சேமிப்பிலிருந்து {amount} பயன்படுத்தவும்"
        },
        "useBufferWhy": {
            "en": "This week's income is lower than normal. Your emergency savings protect you now.",
            "bn": "এই সপ্তাহের আয় স্বাভাবিকের চেয়ে কম। আপনার জরুরি সঞ্চয় এখন আপনাকে সুরক্ষা দেবে।",
            "hi": "इस सप्ताह की आय सामान्य से कम है। आपकी आपातकालीन बचत अब आपकी मदद करेगी।",
            "ta": "இந்த வார வருமானம் இயல்பை விட குறைவு. உங்கள் அவசரகால சேமிப்பு இப்போது உங்களைப் பாதுகாக்கும்."
        },
        "useBufferImpact": {
            "en": "Keeps all your upcoming bills paid on time with zero debt.",
            "bn": "কোনো ঋণ ছাড়াই আপনার সমস্ত আসন্ন বিল সময়মতো পরিশোধ রাখবে।",
            "hi": "बिना किसी कर्ज के आपके सभी आगामी बिल समय पर चुक जाएंगे।",
            "ta": "எந்த கடனும் இன்றி உங்கள் அனைத்து பில்களையும் சரியான நேரத்தில் செலுத்த உதவுகிறது."
        },
        "useBufferCta": {
            "en": "Use {amount} from savings",
            "bn": "সঞ্চয় থেকে {amount} ব্যবহার করুন",
            "hi": "बचत से {amount} इस्तेमाल करें",
            "ta": "சேமிப்பிலிருந்து {amount} பயன்படுத்தவும்"
        }
    },
    "transactions": {
        "emptyDesc": {
            "en": "Add your income payouts or essential expenses to start generating your personalized Smart Income Buffer recommendations.",
            "bn": "আপনার আয়ের প্রাপ্তি বা জরুরি খরচ যোগ করুন যাতে স্মার্ট বাফার আপনার জন্য পরামর্শ তৈরি করতে পারে।",
            "hi": "अपनी आय या आवश्यक खर्च जोड़ें ताकि स्मार्ट बफर आपके लिए सुझाव तैयार कर सके।",
            "ta": "உங்கள் தனிப்பயனாக்கப்பட்ட ஸ்மார்ட் சேமிப்பு பரிந்துரைகளைப் பெற உங்கள் வருமானம் அல்லது செலவுகளைச் சேர்க்கவும்."
        },
        "recordFirst": {
            "en": "Record First Transaction",
            "bn": "প্রথম লেনদেন লিপিবদ্ধ করুন",
            "hi": "पहला लेनदेन दर्ज करें",
            "ta": "முதல் பரிவர்த்தனையை பதிவு செய்யவும்"
        }
    },
    "calendar": {
        "today": {
            "en": "Today",
            "bn": "আজ",
            "hi": "आज",
            "ta": "இன்று"
        },
        "risk": {
            "en": "Risk",
            "bn": "ঝুঁকি",
            "hi": "जोखिम",
            "ta": "ஆபத்து"
        },
        "moreEvents": {
            "en": "+{count} more",
            "bn": "+{count} আরও",
            "hi": "+{count} और",
            "ta": "+{count} மேலும்"
        },
        "liquidityFalls": {
            "en": "Liquidity falls below cash reserve",
            "bn": "নগদ রিজার্ভের নিচে তারল্য হ্রাস",
            "hi": "नकद रिजर्व से नीचे लिक्विडिटी",
            "ta": "பண கையிருப்புக்குக் கீழே குறைகிறது"
        },
        "reservesSecure": {
            "en": "Reserves secure across all dates",
            "bn": "সকল তারিখে তহবিল সুরক্ষিত",
            "hi": "सभी तिथियों पर फंड सुरक्षित",
            "ta": "அனைத்து தேதிகளிலும் நிதி பாதுகாப்பானது"
        },
        "vaultBuffer": {
            "en": "Vault Buffer Reserve",
            "bn": "বাফার রিজার্ভ তহবিল",
            "hi": "वॉल्ट बफर रिजर्व",
            "ta": "சேமிப்பு பெட்டக இருப்பு"
        },
        "safe": {
            "en": "Safe",
            "bn": "সুরক্ষিত",
            "hi": "सुरक्षित",
            "ta": "பாதுகாப்பானது"
        },
        "protectedFloorLabel": {
            "en": "Protected Floor:",
            "bn": "সুরক্ষিত ন্যূনতম সীমা:",
            "hi": "सुरक्षित न्यूनतम स्तर:",
            "ta": "பாதுகாக்கப்பட்ட தளம்:"
        },
        "zeroPressureTitle": {
            "en": "Zero Cash Pressure Days in {month}",
            "bn": "{month} মাসে কোনো ক্যাশ প্রেসার দিন নেই",
            "hi": "{month} में कोई नकदी दबाव वाले दिन नहीं",
            "ta": "{month} மாதத்தில் பண அழுத்த நாட்கள் இல்லை"
        },
        "zeroPressureDesc": {
            "en": "Deterministic calculations confirm your projected cash balance maintains a safe cushion above the mandatory reserve floor across all days of this month.",
            "bn": "হিসাব নিশ্চিত করছে যে চলতি মাসের প্রতিটি দিনে আপনার আনুমানিক ব্যালেন্স বাধ্যতামূলক রিজার্ভের চেয়ে নিরাপদ অবস্থানে থাকবে।",
            "hi": "गणना पुष्टि करती है कि इस महीने के सभी दिनों में आपका अनुमानित बैलेंस अनिवार्य रिजर्व स्तर से ऊपर सुरक्षित रहेगा।",
            "ta": "இந்த மாதத்தின் அனைத்து நாட்களிலும் உங்கள் கணக்கிடப்பட்ட இருப்பு பாதுகாப்பான அளவுக்கு மேல் இருக்கும் என்பதை உறுதி செய்கிறது."
        },
        "pressureHorizons": {
            "en": "{count} Cash Pressure Horizon Identified",
            "bn": "{count}টি ক্যাশ ঘাটতি ঝুঁকি চিহ্নিত",
            "hi": "{count} नकदी दबाव के दिन पहचाने गए",
            "ta": "{count} பண அழுத்த நாட்கள் கண்டறியப்பட்டுள்ளன"
        },
        "exposureTotal": {
            "en": "Total simulated liquidity exposure: {amount}",
            "bn": "মোট সম্ভাব্য ঝুঁকি পরিমাণ: {amount}",
            "hi": "कुल संभावित जोखिम राशि: {amount}",
            "ta": "மொத்த கணக்கிடப்பட்ட நிதி இடர்: {amount}"
        },
        "actionRecommended": {
            "en": "Action Recommended",
            "bn": "পদক্ষেপ সুপারিশকৃত",
            "hi": "कार्रवाई अनुशंसित",
            "ta": "நடவடிக்கை பரிந்துரைக்கப்படுகிறது"
        },
        "closingBalance": {
            "en": "Closing Balance",
            "bn": "সমাপনী ব্যালেন্স",
            "hi": "अंतिम शेष राशि",
            "ta": "இறுதி இருப்பு"
        },
        "timelineTitle": {
            "en": "Chronological Cash Timeline ({month})",
            "bn": "ধারাবাহিক ক্যাশ ফ্লো সময়রেখা ({month})",
            "hi": "दैनिक कैश फ्लो समयरेखा ({month})",
            "ta": "காலவரிசை பணப்புழக்கம் ({month})"
        },
        "showingDays": {
            "en": "Showing {count} days",
            "bn": "{count} দিনের বিবরণ প্রদর্শিত",
            "hi": "{count} दिन दिखाए जा रहे हैं",
            "ta": "{count} நாட்கள் காட்டப்படுகின்றன"
        },
        "noActivity": {
            "en": "No activity",
            "bn": "কোনো কার্যক্রম নেই",
            "hi": "कोई गतिविधि नहीं",
            "ta": "எந்த நடவடிக்கையும் இல்லை"
        }
    },
    "modals": {
        "moneyAllocation": {
            "title": {
                "en": "Money Allocation Autopilot",
                "bn": "মানি অ্যালোকেশন অটোপাইলট",
                "hi": "मनी एलोकेशन ऑटोपायलट",
                "ta": "பண ஒதுக்கீடு தானியங்கி"
            },
            "simulatorBadge": {
                "en": "What-If Simulator",
                "bn": "সিমুলেটর",
                "hi": "सिम्युलेटर",
                "ta": "உருவகப்படுத்துதல்"
            },
            "subtitle": {
                "en": "Customize how {amount} is split. Changes are simulated in real-time.",
                "bn": "কীভাবে {amount} ভাগ করবেন তা পরিবর্তন করুন। ফলাফল রিয়েল-টাইমে দেখা যাবে।",
                "hi": "तय करें कि {amount} कैसे बंटे। परिणाम तुरंत दिखाई देंगे।",
                "ta": "{amount} எவ்வாறு பிரிக்கப்படுகிறது என்பதைத் தனிப்பயனாக்குங்கள். முடிவுகள் உடனுக்குடன் தெரியும்."
            },
            "unsafeConfig": {
                "en": "Unsafe Allocation Configuration",
                "bn": "অনিরাপদ বণ্টন পরিকল্পনা",
                "hi": "असुरक्षित आवंटन कॉन्फ़िगरेशन",
                "ta": "பாதுகாப்பற்ற ஒதுக்கீடு கட்டமைப்பு"
            },
            "cautionConfig": {
                "en": "Caution: Sub-optimal Financial Strategy",
                "bn": "সতর্কতা: ঝুঁকিপূর্ণ আর্থিক কৌশল",
                "hi": "चेतावनी: जोखिम भरी वित्तीय रणनीति",
                "ta": "எச்சரிக்கை: உகந்ததல்லாத நிதி உத்தி"
            },
            "verifiedSafe": {
                "en": "Verified Safe Allocation",
                "bn": "যাচাইকৃত নিরাপদ বণ্টন",
                "hi": "सत्यापित सुरक्षित आवंटन",
                "ta": "சரிபார்க்கப்பட்ட பாதுகாப்பான ஒதுக்கீடு"
            },
            "statusLabel": {
                "en": "Status: {status}",
                "bn": "স্থিতি: {status}",
                "hi": "स्थिति: {status}",
                "ta": "நிலை: {status}"
            },
            "safeExplanation": {
                "en": "Maintains emergency buffer floor, covers essential living costs, and enhances resilience score.",
                "bn": "জরুরি বাফার স্তর রক্ষা করে, প্রয়োজনীয় খরচ মেটায় এবং সক্ষমতা স্কোর বৃদ্ধি করে।",
                "hi": "आपातकालीन बफर को सुरक्षित रखता है, आवश्यक खर्चों को पूरा करता है और स्कोर बढ़ाता है।",
                "ta": "அவசரகால பாதுகாப்பை பராமரிக்கிறது, அத்தியாவசிய செலவுகளை ஈடுசெய்கிறது மற்றும் மதிப்பெண்ணை உயர்த்துகிறது."
            },
            "resetButton": {
                "en": "Reset to Safe Defaults",
                "bn": "নিরাপদ ডিফল্টে রিসেট করুন",
                "hi": "सुरक्षित डिफॉल्ट पर रीसेट करें",
                "ta": "பாதுகாப்பான நிலைக்கு மீட்டமை"
            },
            "simulateButton": {
                "en": "Simulate & Check Safety",
                "bn": "সিমুলেট ও নিরাপত্তা পরীক্ষা",
                "hi": "सिम्युलेट और सुरक्षा जांचें",
                "ta": "பாதுகாப்பை சரிபார்க்கவும்"
            },
            "approveButton": {
                "en": "Approve & Lock Plan",
                "bn": "পরিকল্পনা নিশ্চিত ও লক করুন",
                "hi": "योजना स्वीकृत और लॉक करें",
                "ta": "திட்டத்தை அங்கீகரித்து பூட்டவும்"
            },
            "cannotApproveUnsafe": {
                "en": "Cannot approve unsafe allocation. Please fix safety warnings.",
                "bn": "অনিরাপদ বণ্টন অনুমোদন করা যাবে না। অনুগ্রহ করে সতর্কতাগুলো সমাধান করুন।",
                "hi": "असुरक्षित आवंटन स्वीकृत नहीं किया जा सकता। कृपया चेतावनियों को ठीक करें।",
                "ta": "பாதுகாப்பற்ற ஒதுக்கீட்டை அங்கீகரிக்க முடியாது. எச்சரிக்கைகளை சரிசெய்யவும்."
            },
            "approvedSuccess": {
                "en": "Autopilot Allocation successfully approved & simulated!",
                "bn": "অটোপাইলট বণ্টন সফলভাবে অনুমোদিত ও সংরক্ষিত হয়েছে!",
                "hi": "ऑटोपायलट आवंटन सफलतापूर्वक स्वीकृत और सिम्युलेट हुआ!",
                "ta": "தானியங்கி ஒதுக்கீடு வெற்றிகரமாக அங்கீகரிக்கப்பட்டது!"
            }
        }
    }
}

languages = ["en", "bn", "hi", "ta"]

for lang in languages:
    filepath = Path(f"apps/web/messages/{lang}.json")
    with open(filepath, "r", encoding="utf-8") as fp:
        data = json.load(fp)

    for section, keys in translations_to_add.items():
        if section not in data:
            data[section] = {}
        for k, v in keys.items():
            if isinstance(v, dict) and lang in v:
                data[section][k] = v[lang]
            elif isinstance(v, dict):
                # Nested sub-section (like modals.moneyAllocation)
                if k not in data[section]:
                    data[section][k] = {}
                for subk, subv in v.items():
                    data[section][k][subk] = subv[lang]

    with open(filepath, "w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)
        fp.write("\n")

print("All translations successfully updated across en, bn, hi, ta!")
