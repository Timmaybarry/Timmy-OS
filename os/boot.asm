; Timmy OS - 512-byte bootable real-mode OS with a tiny shell
[bits 16]
[org 0x7c00]

start:
    cli
    xor ax, ax
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov sp, 0x7c00
    sti
    call clear
    mov si, banner
    call puts

shell:
    mov si, prompt
    call puts
    mov di, buf
.read:
    xor ah, ah
    int 0x16
    cmp al, 13
    je .enter
    cmp al, 8
    je .bs
    cmp di, buf + 60
    jae .read
    stosb
    mov ah, 0x0e
    int 0x10
    jmp .read
.bs:
    cmp di, buf
    je .read
    dec di
    mov si, bsseq
    call puts
    jmp .read
.enter:
    xor al, al
    stosb
    mov si, crlf
    call puts
    mov si, buf
    cmp byte [si], 0
    je shell

    mov di, c_help
    call streq
    je do_help
    mov di, c_clear
    call streq
    je do_clear
    mov di, c_about
    call streq
    je do_about
    mov di, c_reboot
    call streq
    je do_reboot
    mov di, c_echo
    call prefix
    je do_echo
    mov si, unknown
    call puts
    jmp shell

do_help:
    mov si, helptxt
    jmp say
do_about:
    mov si, abouttxt
    jmp say
do_clear:
    call clear
    jmp shell
do_echo:
    mov si, buf + 5
    call puts
    mov si, crlf
say:
    call puts
    jmp shell
do_reboot:
    int 0x19

clear:
    mov ax, 0x0003
    int 0x10
    ret

puts:
    lodsb
    test al, al
    jz .d
    mov ah, 0x0e
    int 0x10
    jmp puts
.d: ret

; streq: compare buf with string at DI; ZF=1 if equal
streq:
    mov si, buf
.l: lodsb
    scasb
    jne .n
    test al, al
    jnz .l
    xor al, al          ; sets ZF
    ret
.n: or al, 1            ; clears ZF
    ret

; prefix: ZF=1 if buf starts with string at DI (e.g. "echo ")
prefix:
    mov si, buf
.l: mov al, [di]
    test al, al
    jz .y
    cmp al, [si]
    jne .n
    inc si
    inc di
    jmp .l
.y: xor al, al
    ret
.n: or al, 1
    ret

banner  db 'Timmy OS v0.1', 13, 10, "Type 'help'.", 13, 10, 0
prompt  db 'timmy> ', 0
crlf    db 13, 10, 0
bsseq   db 8, ' ', 8, 0
unknown db 'Unknown command', 13, 10, 0
helptxt db 'help clear about echo <text> reboot', 13, 10, 0
abouttxt db 'Timmy OS - built by Timmaybarry', 13, 10, 0
c_help  db 'help', 0
c_clear db 'clear', 0
c_about db 'about', 0
c_reboot db 'reboot', 0
c_echo  db 'echo ', 0

buf equ 0x7e00

times 510 - ($ - $$) db 0
dw 0xaa55
