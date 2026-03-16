import random

towns = ["Chorley", "Preston", "Leyland", "Blackburn", "Bolton", "Wigan", "Manchester", "Liverpool", "Leeds", "Sheffield", "Newcastle", "London", "Birmingham", "Bristol", "Glasgow"]

artists = [
    "Neon Harbor", "Juno Vale", "The Midnight Echo", "Solar Flare", "Velvet Underground",
    "Luna Blue", "Starlight Symphony", "Oceania", "Echo Canyon", "Wildwood",
    "Silver Lining", "The Groove Collective", "Pulse", "Rhythm & Blues", "The Wanderers"
]

genres = [
    "Synthpop", "Indie Rock", "Jazz Fusion", "Electronic", "Psych Rock",
    "Dream Pop", "Classical", "Folk", "Surf Rock", "Americana",
    "Soul", "Funk", "House", "Blues", "Alternative"
]

venues = [
    "The Crown Social", "River Room", "The Grand Stage", "Blue Note", "Acoustic Attic",
    "The Sound House", "Vibe Central", "Melody Mansion", "The Basement", "Sky Lounge",
    "Harbor Lights", "The Junction", "Electric Alley", "Harmony Hall", "The Workshop"
]

cities = towns

def generate_seeds():
    users = []
    ratings = []
    
    # Artists
    for i, name in enumerate(artists):
        id = f"artist-{i+1}"
        town = random.choice(towns)
        users.append({
            "id": id,
            "name": name,
            "email": f"artist{i+1}@enlive.local",
            "role": "artist",
            "location": town,
            "genre": genres[i] if i < len(genres) else random.choice(genres)
        })
        # 3 ratings each
        for j in range(3):
            score1 = random.randint(3, 5)
            score2 = random.randint(3, 5)
            score3 = random.randint(3, 5)
            score4 = random.randint(3, 5)
            overall = round(((score1 + score2 + score3 + score4) / 20) * 100, 2)
            ratings.append({
                "id": f"r-a-{i+1}-{j+1}",
                "target_id": id,
                "target_type": "artist",
                "c1": score1, "c2": score2, "c3": score3, "c4": score4,
                "overall": overall,
                "location": town
            })

    # Venues
    for i, name in enumerate(venues):
        id = f"venue-{i+1}"
        town = random.choice(towns)
        users.append({
            "id": id,
            "name": name,
            "email": f"venue{i+1}@enlive.local",
            "role": "venue",
            "location": town,
            "genre": "Live Music Venue"
        })
        # 3 ratings each
        for j in range(3):
            score1 = random.randint(3, 5)
            score2 = random.randint(3, 5)
            score3 = random.randint(3, 5)
            score4 = random.randint(3, 5)
            overall = round(((score1 + score2 + score3 + score4) / 20) * 100, 2)
            ratings.append({
                "id": f"r-v-{i+1}-{j+1}",
                "target_id": id,
                "target_type": "venue",
                "c1": score1, "c2": score2, "c3": score3, "c4": score4,
                "overall": overall,
                "location": town
            })

    # Cities
    for i, name in enumerate(cities):
        id = f"city-{i+1}"
        users.append({
            "id": id,
            "name": name,
            "email": f"city{i+1}@enlive.local",
            "role": "city",
            "location": name,
            "genre": "City"
        })
        # 3 ratings each
        for j in range(3):
            score1 = random.randint(3, 5)
            score2 = random.randint(3, 5)
            score3 = random.randint(3, 5)
            score4 = random.randint(3, 5)
            overall = round(((score1 + score2 + score3 + score4) / 20) * 100, 2)
            ratings.append({
                "id": f"r-c-{i+1}-{j+1}",
                "target_id": id,
                "target_type": "city",
                "c1": score1, "c2": score2, "c3": score3, "c4": score4,
                "overall": overall,
                "location": name
            })

    # Admin
    users.append({
        "id": "admin-enlive",
        "name": "Enlive Admin",
        "email": "admin@enlive.local",
        "role": "admin",
        "location": "Chorley",
        "genre": "Admin"
    })

    print("function seedUsers(): UserRow[] {")
    print("  return [")
    for u in users:
        print(f"    {{ id: \"{u['id']}\", name: \"{u['name']}\", email: \"{u['email']}\", password_hash: hashPassword(\"demo123\"), role: \"{u['role']}\", location: \"{u['location']}\", genre: \"{u['genre']}\", created_at: \"2026-02-20T18:00:00.000Z\" }},")
    print("  ];")
    print("}")
    print()
    print("function seedRatings(): RatingRow[] {")
    print("  return [")
    for r in ratings:
        print(f"    {{ id: \"{r['id']}\", target_id: \"{r['target_id']}\", target_type: \"{r['target_type']}\", category_1_score: {r['c1']}, category_2_score: {r['c2']}, category_3_score: {r['c3']}, category_4_score: {r['c4']}, overall_score: {r['overall']}, location: \"{r['location']}\", device_id: \"seed-device\", created_at: \"2026-02-21T19:00:00.000Z\" }},")
    print("  ];")
    print("}")

generate_seeds()
