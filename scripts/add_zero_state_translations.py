# -*- coding: utf-8 -*-
import json

paths = {
    'en': 'apps/web/messages/en.json',
    'bn': 'apps/web/messages/bn.json',
    'hi': 'apps/web/messages/hi.json',
    'ta': 'apps/web/messages/ta.json',
}

updates = {
    'en': {
        'automaticMoneyPlan': {
            'emergencySavingsZeroDesc': 'All {amount} needed for essentials first. Extra stash starts once earnings exceed essentials.',
            'spendingMoneyZeroDesc': '₹0 discretionary cash. All funds held to protect rent, groceries, and essential bills.',
        },
        'summaryCards': {
            'zeroStressDailyZero': 'Reserved for essentials · No extra spending cash this week',
        }
    },
    'bn': {
        'automaticMoneyPlan': {
            'emergencySavingsZeroDesc': 'পুরো {amount} আগে জরুরি খরচের জন্য বরাদ্দ। জরুরি খরচ মিটলে উদ্বৃত্ত টাকা এখানে সঞ্চিত হবে।',
            'spendingMoneyZeroDesc': '₹০ অতিরিক্ত ব্যয়ের সুযোগ। বাড়ি ভাড়া, খাবার ও প্রয়োজনীয় বিল সুরক্ষায় সমস্ত টাকা সংরক্ষিত।',
        },
        'summaryCards': {
            'zeroStressDailyZero': 'জরুরি খরচের জন্য সংরক্ষিত · এই সপ্তাহে অতিরিক্ত খরচের টাকা নেই',
        }
    },
    'hi': {
        'automaticMoneyPlan': {
            'emergencySavingsZeroDesc': 'पूरा {amount} पहले आवश्यक खर्चों के लिए रखा गया है। आवश्यक खर्च पूरे होने के बाद अतिरिक्त बचत यहाँ जुड़ेगी।',
            'spendingMoneyZeroDesc': '₹0 अतिरिक्त खर्च के लिए। किराया, भोजन और आवश्यक बिलों की सुरक्षा के लिए पूरी राशि रोकी गई है।',
        },
        'summaryCards': {
            'zeroStressDailyZero': 'ज़रूरी खर्चों के लिए आरक्षित · इस सप्ताह कोई अतिरिक्त खर्च राशि नहीं है',
        }
    },
    'ta': {
        'automaticMoneyPlan': {
            'emergencySavingsZeroDesc': 'முழு {amount} முதலில் அத்தியாவசிய செலவுகளுக்காக தேவைப்படுகிறது. அது முடிந்ததும் கூடுதல் சேமிப்பு இங்கே சேரும்.',
            'spendingMoneyZeroDesc': '₹0 கூடுதல் செலவு. வாடகை, உணவு மற்றும் அத்தியாவசிய பில்களைப் பாதுகாக்க முழு தொகையும் ஒதுக்கப்பட்டுள்ளது.',
        },
        'summaryCards': {
            'zeroStressDailyZero': 'அத்தியாவசிய செலவுகளுக்காக ஒதுக்கப்பட்டுள்ளது · இந்த வாரம் கூடுதல் செலவு தொகை இல்லை',
        }
    }
}

def deep_merge(target, src):
    for k, v in src.items():
        if isinstance(v, dict) and k in target and isinstance(target[k], dict):
            deep_merge(target[k], v)
        else:
            target[k] = v

for lang, p in paths.items():
    with open(p, 'r', encoding='utf-8') as f:
        data = json.load(f)
    deep_merge(data, updates[lang])
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print('Updated zero-state translations across all 4 locales.')
