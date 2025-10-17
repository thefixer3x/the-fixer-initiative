#!/bin/bash
# Process checker - outputs to file to avoid JSON interference
ps aux | grep -E "(node|mcp|json)" > process-check.txt 2>&1
echo "Process check complete - see process-check.txt"
