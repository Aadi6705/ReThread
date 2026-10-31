import re
import html

def sanitize_text(text: str) -> str:
    """
    Sanitize text input to protect against stored XSS attacks.
    Strips raw HTML tags and dangerous patterns while preserving safe unicode and punctuation.
    """
    if not text:
        return text
    
    # Strip dangerous HTML script tags, iframe, object, embed, etc.
    cleaned = re.sub(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", "", text, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>", "", cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"<\s*(style|object|embed|applet)[^>]*>.*?<\s*/\s*\1\s*>", "", cleaned, flags=re.IGNORECASE | re.DOTALL)
    # Strip javascript: URIs
    cleaned = re.sub(r"javascript:[^\s\"'>]+", "", cleaned, flags=re.IGNORECASE)
    # Strip generic HTML tags while keeping contents
    cleaned = re.sub(r"<[^>]+>", "", cleaned)
    
    return cleaned.strip()
