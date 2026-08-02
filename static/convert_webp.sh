find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read img; do   cwebp -q 80 "$img" -o "${img%.*}.webp"; done
