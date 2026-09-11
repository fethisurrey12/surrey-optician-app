"""The practice's four branches.

    Addresses and numbers are from the practice's own Surrey Opticians Lookbook,
    not guessed.

Served from the API so opening hours or a phone number can change without an
App Store release. The shape matches the Branch type the app already uses.
"""

# Opening hours are the one thing the brand book does not state; these carry
# over from the prototype and still need confirming with the practice.
HOURS = [
    {"days": "Monday – Friday", "time": "9:00 – 17:30"},
    {"days": "Saturday", "time": "9:00 – 16:00"},
    {"days": "Sunday", "time": "Closed"},
]

BRANCHES = [
    {
        "id": "coulsdon",
        "name": "Coulsdon",
        "address": ["141 Brighton Road", "Coulsdon", "CR5 2NJ"],
        "phone": "+442086607343",
        "phoneDisplay": "020 8660 7343",
        "hours": HOURS,
        "mapQuery": "Surrey Opticians, 141 Brighton Road, Coulsdon CR5 2NJ",
    },
    {
        "id": "wallington",
        "name": "Wallington",
        "address": ["116 Woodcote Road", "Wallington", "SM6 0LY"],
        "phone": "+442086473644",
        "phoneDisplay": "020 8647 3644",
        "hours": HOURS,
        "mapQuery": "Surrey Opticians, 116 Woodcote Road, Wallington SM6 0LY",
    },
    {
        "id": "wallington-green",
        "name": "Wallington Green",
        "address": ["381 Croydon Road", "Wallington Green", "SM6 7NY"],
        "phone": "+442086478992",
        "phoneDisplay": "020 8647 8992",
        "hours": HOURS,
        "mapQuery": "Surrey Opticians, 381 Croydon Road, Wallington SM6 7NY",
    },
    {
        "id": "banstead",
        "name": "Banstead",
        "address": ["157 High Street", "Banstead", "SM7 2NT"],
        "phone": "+441737850349",
        "phoneDisplay": "01737 850349",
        "hours": HOURS,
        "mapQuery": "Surrey Opticians, 157 High Street, Banstead SM7 2NT",
    },
]

PRACTICE_EMAIL = "info@surreyopticians.com"
BRANCH_IDS = {b["id"] for b in BRANCHES}


def valid_branch(branch_id: str) -> bool:
    return branch_id in BRANCH_IDS
