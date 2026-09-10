"""The practice's branches.

Served from the API so opening hours or a phone number can change without an
App Store release. The shape matches the Branch type the app already uses.
"""

BRANCHES = [
    {
        "id": "coulsdon",
        "name": "Coulsdon",
        "address": ["128 Chipstead Valley Road", "Coulsdon", "CR5 2RA"],
        "phone": "+441737550132",
        "phoneDisplay": "01737 550132",
        "hours": [
            {"days": "Monday – Friday", "time": "9:00 – 17:30"},
            {"days": "Saturday", "time": "9:00 – 16:00"},
            {"days": "Sunday", "time": "Closed"},
        ],
        "mapQuery": "Surrey Opticians, Chipstead Valley Road, Coulsdon CR5 2RA",
    },
    {
        "id": "wallington",
        "name": "Wallington",
        "address": ["42 Woodcote Road", "Wallington", "SM6 0LY"],
        "phone": "+442086475521",
        "phoneDisplay": "020 8647 5521",
        "hours": [
            {"days": "Monday – Friday", "time": "9:00 – 17:30"},
            {"days": "Saturday", "time": "9:00 – 16:00"},
            {"days": "Sunday", "time": "Closed"},
        ],
        "mapQuery": "Surrey Opticians, Woodcote Road, Wallington SM6 0LY",
    },
    {
        "id": "banstead",
        "name": "Banstead",
        "address": ["15 High Street", "Banstead", "SM7 2LJ"],
        "phone": "+441737362240",
        "phoneDisplay": "01737 362240",
        "hours": [
            {"days": "Monday – Friday", "time": "9:00 – 17:30"},
            {"days": "Saturday", "time": "9:00 – 16:00"},
            {"days": "Sunday", "time": "Closed"},
        ],
        "mapQuery": "Surrey Opticians, High Street, Banstead SM7 2LJ",
    },
]

PRACTICE_EMAIL = "hello@surreyopticians.co.uk"
BRANCH_IDS = {b["id"] for b in BRANCHES}


def valid_branch(branch_id: str) -> bool:
    return branch_id in BRANCH_IDS
