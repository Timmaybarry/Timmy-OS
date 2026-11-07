all: timmy.img

timmy.img: boot.asm
	nasm -f bin boot.asm -o timmy.img

run: timmy.img
	qemu-system-x86_64 -drive format=raw,file=timmy.img

clean:
	rm -f timmy.img
