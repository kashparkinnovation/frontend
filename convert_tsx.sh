#!/bin/bash
find src -type f -name "*.tsx" | while read -r file; do
    echo "Converting $file"
    outfile="${file%.tsx}.jsx"
    npx --yes detype "$file" "$outfile"
    if [ $? -eq 0 ]; then
        rm "$file"
    else
        echo "Failed to convert $file"
    fi
done

find src -type f -name "*.ts" | while read -r file; do
    echo "Converting $file"
    outfile="${file%.ts}.js"
    npx --yes detype "$file" "$outfile"
    if [ $? -eq 0 ]; then
        rm "$file"
    else
        echo "Failed to convert $file"
    fi
done
